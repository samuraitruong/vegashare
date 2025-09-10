export function generateStaticParams() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear; y >= 2022; y--) {
        years.push({ year: y.toString() });
    }
    return years;
}
