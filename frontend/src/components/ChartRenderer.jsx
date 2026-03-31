import {
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell, Legend,
  ScatterChart, Scatter, ZAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// Chart color palette
const COLORS = ['#4f6ef7', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

const CHART_ICONS = {
  bar: '▊',
  line: '📈',
  area: '▓',
  pie: '◉',
  scatter: '⬤',
};

// Truncate long tick labels
function truncate(str, n = 12) {
  if (typeof str !== 'string') return str;
  return str.length > n ? str.slice(0, n) + '…' : str;
}

function BarChartWrapper({ spec }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={spec.data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2f45" />
        <XAxis dataKey={spec.x_key} tick={{ fill: '#4a5280', fontSize: 11 }} tickFormatter={(v) => truncate(String(v))} />
        <YAxis tick={{ fill: '#4a5280', fontSize: 11 }} />
        <Tooltip contentStyle={{ background: '#1a1d26', border: '1px solid #2a2f45', borderRadius: 6, fontSize: 12 }} />
        <Bar dataKey={spec.y_key} fill="#4f6ef7" radius={[4, 4, 0, 0]}>
          {spec.data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function LineChartWrapper({ spec }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={spec.data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2f45" />
        <XAxis dataKey={spec.x_key} tick={{ fill: '#4a5280', fontSize: 11 }} tickFormatter={(v) => truncate(String(v))} />
        <YAxis tick={{ fill: '#4a5280', fontSize: 11 }} />
        <Tooltip contentStyle={{ background: '#1a1d26', border: '1px solid #2a2f45', borderRadius: 6, fontSize: 12 }} />
        <Line type="monotone" dataKey={spec.y_key} stroke="#4f6ef7" strokeWidth={2} dot={{ r: 3, fill: '#4f6ef7' }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function AreaChartWrapper({ spec }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={spec.data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4f6ef7" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#4f6ef7" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2f45" />
        <XAxis dataKey={spec.x_key} tick={{ fill: '#4a5280', fontSize: 11 }} tickFormatter={(v) => truncate(String(v))} />
        <YAxis tick={{ fill: '#4a5280', fontSize: 11 }} />
        <Tooltip contentStyle={{ background: '#1a1d26', border: '1px solid #2a2f45', borderRadius: 6, fontSize: 12 }} />
        <Area type="monotone" dataKey={spec.y_key} stroke="#4f6ef7" strokeWidth={2} fill="url(#areaGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function PieChartWrapper({ spec }) {
  const labelKey = spec.label_key || spec.x_key;
  const valueKey = spec.value_key || spec.y_key;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={spec.data}
          dataKey={valueKey}
          nameKey={labelKey}
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={({ name, percent }) => `${truncate(String(name), 10)} ${(percent * 100).toFixed(0)}%`}
          labelLine={{ stroke: '#4a5280' }}
        >
          {spec.data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={{ background: '#1a1d26', border: '1px solid #2a2f45', borderRadius: 6, fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function ScatterChartWrapper({ spec }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ScatterChart margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2f45" />
        <XAxis dataKey={spec.x_key} type="number" name={spec.x_key} tick={{ fill: '#4a5280', fontSize: 11 }} />
        <YAxis dataKey={spec.y_key} type="number" name={spec.y_key} tick={{ fill: '#4a5280', fontSize: 11 }} />
        <ZAxis range={[40, 40]} />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: '#1a1d26', border: '1px solid #2a2f45', borderRadius: 6, fontSize: 12 }} />
        <Scatter data={spec.data} fill="#4f6ef7" opacity={0.8} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

const CHART_MAP = {
  bar: BarChartWrapper,
  line: LineChartWrapper,
  area: AreaChartWrapper,
  pie: PieChartWrapper,
  scatter: ScatterChartWrapper,
};

export default function ChartRenderer({ spec, index }) {
  const Component = CHART_MAP[spec.type];

  if (!Component) {
    return (
      <div className="chart-card">
        <div className="chart-card-title">Unknown chart type: {spec.type}</div>
      </div>
    );
  }

  return (
    <div className="chart-card" style={{ animationDelay: `${index * 0.1}s` }}>
      <div className="chart-type-badge">{CHART_ICONS[spec.type]} {spec.type}</div>
      <div className="chart-card-title">{spec.title}</div>
      {spec.description && <div className="chart-card-desc">{spec.description}</div>}
      <Component spec={spec} />
    </div>
  );
}
