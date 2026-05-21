from prometheus_client import Counter, Histogram, Gauge

# Agent call counters
agent_calls = Counter(
    'agent_calls_total',
    'Total number of agent calls',
    ['agent_name', 'ticker']
)

# Agent latency
agent_latency = Histogram(
    'agent_duration_seconds',
    'Time spent running each agent',
    ['agent_name']
)

# Mistral API errors
mistral_errors = Counter(
    'mistral_errors_total',
    'Total Mistral API errors',
    ['agent_name']
)

# Cache hits
cache_hits = Counter(
    'cache_hits_total',
    'Total cache hits',
    ['ticker']
)

# Active analyses
active_analyses = Gauge(
    'active_analyses',
    'Number of analyses currently running'
)