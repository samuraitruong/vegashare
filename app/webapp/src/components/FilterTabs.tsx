import React from "react";

interface FilterTabsProps {
    options: string[];
    activeOption: string;
    onOptionChange: (option: string) => void;
}

// Removed duplicate/incorrect declaration
const FilterTabs: React.FC<FilterTabsProps> = ({ options, activeOption, onOptionChange }) => {
    return (
        <nav className="bg-white border-b border-gray-200 shadow-sm">
            <div className="px-0 md:px-4">
                {/* Desktop tabs */}
                <div className="hidden lg:block">
                    <div className="flex justify-center border-b border-gray-200">
                        {options.map((option: string) => (
                            <button
                                key={option}
                                className={`relative px-8 py-4 font-medium text-sm transition-all duration-200 border-b-2 -mb-px ${activeOption === option
                                    ? "text-blue-600 border-blue-600 bg-blue-50"
                                    : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                                    }`}
                                onClick={() => onOptionChange(option)}
                            >
                                {option}
                                {activeOption === option && (
                                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-600"></div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mobile tabs */}
                <div className="lg:hidden">
                    <div className="flex justify-center border-b border-gray-200">
                        {options.map((option: string) => (
                            <button
                                key={option}
                                className={`flex-1 px-1 md:px-4 py-4 font-medium text-sm transition-all duration-200 border-b-2 -mb-px ${activeOption === option
                                    ? "text-blue-600 border-blue-600 bg-blue-50"
                                    : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                                    }`}
                                onClick={() => onOptionChange(option)}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default FilterTabs;
