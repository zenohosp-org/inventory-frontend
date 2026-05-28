/**
 * Placeholder shown while a lazy page chunk is still downloading.
 * Mimics the rough shape of every list page: a header strip, a filter strip,
 * then ~8 table rows. Keeps the layout from jumping when the real page mounts.
 */
export default function PageSkeleton() {
    return (
        <div className="main-content">
            <div className="page-header">
                <div className="page-header-left">
                    <div className="sk-line sk-line--title" />
                    <div className="sk-line sk-line--subtitle" />
                </div>
                <div className="sk-button" />
            </div>

            <div className="filter-bar">
                <div className="sk-input" />
                <div className="sk-input sk-input--sm" />
            </div>

            <div className="table-container">
                <div className="table-header">
                    <div className="sk-line sk-line--label" />
                </div>
                <div className="table-body">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="sk-row" />
                    ))}
                </div>
            </div>
        </div>
    );
}
