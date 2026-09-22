const chartColors = ['#1d4ed8', '#0ea5e9', '#38bdf8', '#64748b', '#f59e0b', '#e11d48'];

export function LineChart({ data = [] }) {
    const width = 640;
    const height = 220;
    const chartLeft = 34;
    const chartRight = 18;
    const chartWidth = width - chartLeft - chartRight;
    const max = Math.max(...data.map((item) => item.total), 1);
    const points = data.map((item, index) => `${chartLeft + ((index / Math.max(data.length - 1, 1)) * chartWidth)},${height - 28 - ((item.total / max) * (height - 56))}`).join(' ');

    return (
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white p-4">
            <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full" role="img" aria-label="Appointment volume over the last six months">
                {[0, 1, 2, 3].map((line) => {
                    const y = 28 + (line * (height - 56) / 3);
                    return <line key={line} x1={chartLeft} x2={width - chartRight} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />;
                })}
                <polyline fill="none" stroke="#2563eb" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" points={points} />
                {data.map((item, index) => {
                    const x = chartLeft + ((index / Math.max(data.length - 1, 1)) * chartWidth);
                    const y = height - 28 - ((item.total / max) * (height - 56));
                    return <g key={item.label}><circle cx={x} cy={y} r="5" fill="white" stroke="#2563eb" strokeWidth="3" /><text x={x} y={height - 5} textAnchor="middle" fill="#64748b" fontSize="12">{item.label}</text><text x={x} y={y - 12} textAnchor="middle" fill="#1e3a8a" fontSize="11" fontWeight="700">{item.total}</text></g>;
                })}
            </svg>
        </div>
    );
}

export function BarChart({ items = [], color = 'blue' }) {
    const max = Math.max(...items.map((item) => item.value), 1);
    const barClass = color === 'sky' ? 'bg-sky-500' : 'bg-blue-600';

    return (
        <div className="space-y-4">
            {items.map((item) => (
                <div key={item.label}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-xs"><span className="truncate font-semibold text-slate-700">{item.label}</span><span className="font-bold text-slate-500">{item.value}</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${barClass}`} style={{ width: `${Math.max((item.value / max) * 100, item.value ? 4 : 0)}%` }} /></div>
                </div>
            ))}
            {!items.length && <p className="py-8 text-center text-sm text-slate-500">No records available.</p>}
        </div>
    );
}

export function ColumnChart({ items = [] }) {
    const width = 640;
    const height = 260;
    const chartTop = 20;
    const chartBottom = 210;
    const max = Math.max(...items.map((item) => item.value), 1);
    const slotWidth = width / Math.max(items.length, 1);
    const barWidth = Math.min(54, slotWidth * 0.56);

    return (
        <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${width} ${height}`} className="h-64 min-w-[520px] w-full" role="img" aria-label="Requests by service category">
                {[0, 1, 2, 3, 4, 5].map((line) => {
                    const y = chartBottom - (line * (chartBottom - chartTop) / 5);
                    const value = Math.round(max * line / 5);
                    return <g key={line}><line x1="42" x2={width - 18} y1={y} y2={y} stroke="#dbe3ee" strokeWidth="1" /><text x="34" y={y + 4} textAnchor="end" fill="#64748b" fontSize="11">{value}</text></g>;
                })}
                {items.map((item, index) => {
                    const chartWidth = width - 42;
                    const centeredX = (chartWidth / Math.max(items.length, 1)) * index + ((chartWidth / Math.max(items.length, 1) - barWidth) / 2) + 42;
                    const barHeight = (item.value / max) * (chartBottom - chartTop);
                    const y = chartBottom - barHeight;
                    const colors = ['#2563eb', '#84cc16', '#f59e0b', '#ec4899', '#7c3aed', '#0891b2'];

                    return <g key={item.label}><rect x={centeredX} y={y} width={barWidth} height={barHeight} rx="2" fill={colors[index % colors.length]} /><text x={centeredX + (barWidth / 2)} y={y - 8} textAnchor="middle" fill="#1e3a8a" fontSize="12" fontWeight="700">{item.value}</text><text x={centeredX + (barWidth / 2)} y={chartBottom + 22} textAnchor="middle" fill="#475569" fontSize="11">{item.label.length > 12 ? `${item.label.slice(0, 11)}...` : item.label}</text></g>;
                })}
            </svg>
            {!items.length && <p className="py-8 text-center text-sm text-slate-500">No records available.</p>}
        </div>
    );
}

export function DonutChart({ items = [] }) {
    const total = items.reduce((sum, item) => sum + item.value, 0);
    let cursor = 0;
    const segments = items.map((item, index) => {
        const start = total ? (cursor / total) * 360 : 0;
        cursor += item.value;
        const end = total ? (cursor / total) * 360 : 0;
        return `${chartColors[index % chartColors.length]} ${start}deg ${end}deg`;
    });

    return (
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            <div className="relative h-40 w-40 shrink-0 rounded-full" style={{ background: total ? `conic-gradient(${segments.join(', ')})` : '#e2e8f0' }}>
                <div className="absolute inset-8 flex flex-col items-center justify-center rounded-full bg-white"><strong className="text-2xl font-black text-blue-950">{total}</strong><span className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Total</span></div>
            </div>
            <div className="w-full space-y-2.5">
                {items.map((item, index) => <div key={item.label} className="flex items-center justify-between gap-3 text-xs"><span className="flex min-w-0 items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} /><span className="truncate text-slate-600">{item.label}</span></span><strong className="text-slate-800">{item.value}</strong></div>)}
                {!items.length && <p className="text-sm text-slate-500">No records available.</p>}
            </div>
        </div>
    );
}
