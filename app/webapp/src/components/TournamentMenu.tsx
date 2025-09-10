import React, { useState, useEffect, useMemo } from "react";

interface MenuItem {
    text: string;
    href: string;
    isDropdown?: boolean;
    children?: MenuItem[];
}

interface TournamentMenuProps {
    menu: MenuItem[];
    activePage: string;
    onSelectPage: (href: string) => void;
}

const TournamentMenu: React.FC<TournamentMenuProps> = ({ menu, activePage, onSelectPage }) => {
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    const normalizedMenu = useMemo(() => {
        const normalizeMenuItems = (items: MenuItem[]): MenuItem[] => {
            return (items || []).map((item) => {
                const children = item.children && item.children.length > 0 ? normalizeMenuItems(item.children) : undefined;
                const hasChildren = !!(children && children.length > 0);
                
                // Add "View Vega" item to Info menu
                let finalChildren = children;
                if (item.text === "Info" && hasChildren) {
                    const vegaUrl = window.location.href.replace('/v2/', '/www');
                    finalChildren = [
                        ...children!,
                        {
                            text: "View Vega",
                            href: vegaUrl
                        }
                    ];
                }
                
                return {
                    ...item,
                    isDropdown: hasChildren,
                    children: hasChildren ? finalChildren : undefined,
                };
            });
        };
        return normalizeMenuItems(menu);
    }, [menu]);

    // Close dropdown and mobile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.dropdown-') && !target.closest('.mobile-menu-')) {
                setOpenDropdown(null);
                setMobileMenuOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    if (!menu || menu.length === 0) return null;

    return (
        <nav className="bg-white border-b border-gray-200 mb-0 sticky top-0 z-30 shadow-sm">
            <div className="px-1 md:px-4">
                {/* Mobile hamburger button */}
                <div className="lg:hidden flex justify-between items-center py-4 mobile-menu-">
                    <span className="text-lg font-semibold text-blue-800">Tournament Menu</span>
                    <button
                        className="p-2 rounded-md text-blue-700 hover:bg-blue-100 transition-colors duration-200"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {mobileMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Desktop menu - modern tab style */}
                <div className="hidden lg:block">
                    <div className="flex border-b border-gray-200">
                        {normalizedMenu.map((item) => (
                            <div key={item.text} className="relative dropdown-">
                                {item.isDropdown === true ? (
                                    <>
                                        <button
                                            className={`relative px-6 py-4 font-medium text-sm transition-all duration-200 flex items-center gap-2 border-b-2 -mb-px ${openDropdown === item.text
                                                ? "text-blue-600 border-blue-600 bg-blue-50"
                                                : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                                                }`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setOpenDropdown(openDropdown === item.text ? null : item.text);
                                            }}
                                        >
                                            {item.text}
                                            {item.children && item.children.length > 0 && (
                                                <span className={`transition-transform duration-200 ${openDropdown === item.text ? 'rotate-180' : ''}`}>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </span>
                                            )}
                                        </button>
                                        {openDropdown === item.text && item.children && item.children.length > 0 && (
                                            <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-40 overflow-hidden">
                                                <div className="py-2">
                                                    {item.children.map((child) => (
                                                        <button
                                                            key={child.text}
                                                            className={`w-full text-left px-4 py-3 text-sm font-medium transition-all duration-150 ${activePage === child.href
                                                                ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                                                                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                                                }`}
                                                            onClick={() => {
                                                                setOpenDropdown(null);
                                                                // Handle external links (like View Vega)
                                                                if (child.text === "View Vega") {
                                                                    window.open(child.href, '_blank');
                                                                } else {
                                                                    onSelectPage(child.href);
                                                                }
                                                            }}
                                                        >
                                                            {child.text}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <button
                                        className={`relative px-6 py-4 font-medium text-sm transition-all duration-200 border-b-2 -mb-px ${activePage === item.href
                                            ? "text-blue-600 border-blue-600 bg-blue-50"
                                            : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                                            }`}
                                        onClick={() => onSelectPage(item.href)}
                                    >
                                        {item.text}
                                        {activePage === item.href && (
                                            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-600"></div>
                                        )}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mobile menu dropdown */}
                {mobileMenuOpen && (
                    <div className="lg:hidden border-t border-gray-200 bg-gray-50 mobile-menu-">
                        <div className="py-4 space-y-1">
                            {normalizedMenu.map((item) => (
                                <div key={item.text}>
                                    {item.isDropdown === true ? (
                                        <>
                                            <button
                                                className={`w-full text-left px-4 py-3 font-medium text-sm transition-all duration-200 flex items-center justify-between rounded-lg ${openDropdown === item.text
                                                    ? "bg-blue-600 text-white shadow-sm"
                                                    : "text-gray-700 hover:bg-white hover:shadow-sm"
                                                    }`}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setOpenDropdown(openDropdown === item.text ? null : item.text);
                                                }}
                                            >
                                                {item.text}
                                                {item.children && item.children.length > 0 && (
                                                    <span className={`transition-transform duration-200 ${openDropdown === item.text ? 'rotate-180' : ''}`}>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </span>
                                                )}
                                            </button>
                                            {openDropdown === item.text && item.children && item.children.length > 0 && (
                                                <div className="ml-6 mt-2 space-y-1 border-l-2 border-gray-200 pl-4">
                                                    {item.children.map((child) => (
                                                        <button
                                                            key={child.text}
                                                            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ${activePage === child.href
                                                                ? "bg-blue-100 text-blue-800 border-l-2 border-blue-600"
                                                                : "text-gray-600 hover:bg-white hover:text-gray-900"
                                                                }`}
                                                            onClick={() => {
                                                                setOpenDropdown(null);
                                                                setMobileMenuOpen(false);
                                                                // Handle external links (like View Vega)
                                                                if (child.text === "View Vega") {
                                                                    window.open(child.href, '_blank');
                                                                } else {
                                                                    onSelectPage(child.href);
                                                                }
                                                            }}
                                                        >
                                                            {child.text}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <button
                                            className={`w-full text-left px-4 py-3 font-medium text-sm transition-all duration-200 rounded-lg ${activePage === item.href
                                                ? "bg-blue-600 text-white shadow-sm"
                                                : "text-gray-700 hover:bg-white hover:shadow-sm"
                                                }`}
                                            onClick={() => {
                                                setMobileMenuOpen(false);
                                                onSelectPage(item.href);
                                            }}
                                        >
                                            {item.text}
                                            {activePage === item.href && (
                                                <div className="mt-1 h-0.5 bg-white rounded-full hidden md:block"></div>
                                            )}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default TournamentMenu;
