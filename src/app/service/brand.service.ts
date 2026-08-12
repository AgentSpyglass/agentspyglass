import { Injectable } from "@angular/core";
import { Brand } from "@agentspyglass/core";

@Injectable({ providedIn: "root" })
export class BrandService {

    /** Shown whenever no provider/MCP logo can be resolved. Inline SVG so it never fails to load. */
    private readonly FALLBACK_LOGO =
        'data:image/svg+xml;utf8,' + encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="9"/>
        <path d="M9.3 9.5a2.7 2.7 0 1 1 3.7 2.5c-1 .4-1.6 1.1-1.6 2.3" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="17.2" r="0.7" fill="currentColor" stroke="none"/>
      </svg>`
        );

    // ---------------------------------------------------------------------
    // Model / LLM provider logos
    // ---------------------------------------------------------------------

    private readonly FAVICONS: Record<string, string> = {
        openai: 'https://openai.com/favicon.ico',
        anthropic: 'https://www.anthropic.com/favicon.ico',
        google: 'https://gemini.google.com/favicon.ico',
        gemini: 'https://gemini.google.com/favicon.ico',
        deepseek: 'https://www.deepseek.com/favicon.ico',
        mistral: 'https://mistral.ai/favicon.ico',
        xai: 'https://x.ai/favicon.ico',
        grok: 'https://x.ai/favicon.ico',
        meta: 'https://about.meta.com/favicon.ico',
        llama: 'https://about.meta.com/favicon.ico',
        openrouter: 'https://openrouter.ai/favicon.ico',
        groq: 'https://groq.com/favicon.ico',
        togetherai: 'https://www.together.ai/favicon.ico',
        together: 'https://www.together.ai/favicon.ico',
        azure: 'https://azure.microsoft.com/favicon.ico',
        opencode: 'https://opencode.ai/favicon.ico',
        cohere: 'https://cohere.com/favicon.ico',
        perplexity: 'https://www.perplexity.ai/favicon.ico',
        qwen: 'https://qwenlm.github.io/favicon.ico',
        alibaba: 'https://qwenlm.github.io/favicon.ico',
        amazon: 'https://aws.amazon.com/favicon.ico',
        bedrock: 'https://aws.amazon.com/favicon.ico',
        nvidia: 'https://www.nvidia.com/favicon.ico',
        huggingface: 'https://huggingface.co/favicon.ico',
        ollama: 'https://ollama.com/favicon.ico',
    };

    private readonly MODEL_PREFIXES: Record<string, string> = {
        'gpt-': 'openai',
        'o1-': 'openai',
        'o3-': 'openai',
        'o4-': 'openai',
        'chatgpt-': 'openai',
        'claude-': 'anthropic',
        'gemini-': 'google',
        'deepseek-': 'deepseek',
        'mistral-': 'mistral',
        'mixtral-': 'mistral',
        'llama-': 'meta',
        'grok-': 'xai',
        'qwen-': 'qwen',
        'command-': 'cohere',
        'sonar-': 'perplexity',
    };

    // ---------------------------------------------------------------------
    // MCP server logos.
    // Object key order = match priority. Requested priority servers are
    // listed first, followed by a broad set of other common MCP servers.
    // ---------------------------------------------------------------------

    private readonly MCP_FAVICONS: Record<string, string> = {
        // --- opencode tools ---
        opencode: 'https://opencode.ai/favicon.ico',

        // --- priority ---
        context7: 'https://context7.com/favicon.ico',
        bruno: 'https://www.usebruno.com/favicon.ico',
        github: 'https://github.com/favicon.ico',
        playwright: 'https://playwright.dev/img/favicon.ico',
        postgres: 'https://www.postgresql.org/favicon.ico',
        postgresql: 'https://www.postgresql.org/favicon.ico',
        serena: 'https://raw.githubusercontent.com/oraios/serena/main/resources/serena-icon.svg',
        sequentialthinking: 'https://modelcontextprotocol.io/favicon.ico',

        // --- other common MCP servers ---
        modelcontextprotocol: 'https://modelcontextprotocol.io/favicon.ico',
        filesystem: 'https://modelcontextprotocol.io/favicon.ico',
        memory: 'https://modelcontextprotocol.io/favicon.ico',
        fetch: 'https://modelcontextprotocol.io/favicon.ico',
        everything: 'https://modelcontextprotocol.io/favicon.ico',
        git: 'https://git-scm.com/favicon.ico',
        gitlab: 'https://gitlab.com/favicon.ico',
        puppeteer: 'https://pptr.dev/img/favicon.ico',
        sqlite: 'https://www.sqlite.org/favicon.ico',
        mysql: 'https://www.mysql.com/favicon.ico',
        mongodb: 'https://www.mongodb.com/favicon.ico',
        redis: 'https://redis.io/favicon.ico',
        elasticsearch: 'https://www.elastic.co/favicon.ico',
        slack: 'https://slack.com/favicon.ico',
        notion: 'https://www.notion.so/favicon.ico',
        linear: 'https://linear.app/favicon.ico',
        figma: 'https://www.figma.com/favicon.ico',
        sentry: 'https://sentry.io/favicon.ico',
        stripe: 'https://stripe.com/favicon.ico',
        cloudflare: 'https://www.cloudflare.com/favicon.ico',
        vercel: 'https://vercel.com/favicon.ico',
        supabase: 'https://supabase.com/favicon.ico',
        firebase: 'https://firebase.google.com/favicon.ico',
        docker: 'https://www.docker.com/favicon.ico',
        kubernetes: 'https://kubernetes.io/favicon.ico',
        aws: 'https://aws.amazon.com/favicon.ico',
        googledrive: 'https://www.google.com/favicon.ico',
        googlemaps: 'https://maps.google.com/favicon.ico',
        bravesearch: 'https://brave.com/favicon.ico',
        brave: 'https://brave.com/favicon.ico',
        jira: 'https://www.atlassian.com/favicon.ico',
        confluence: 'https://www.atlassian.com/favicon.ico',
        atlassian: 'https://www.atlassian.com/favicon.ico',
        heroku: 'https://www.heroku.com/favicon.ico',
        netlify: 'https://www.netlify.com/favicon.ico',
        digitalocean: 'https://www.digitalocean.com/favicon.ico',
        npm: 'https://www.npmjs.com/favicon.ico',
    };

    /** Maps common raw MCP identifiers to a canonical key in MCP_FAVICONS. */
    private readonly MCP_ALIASES: Record<string, string> = {
        'sequential-thinking': 'sequentialthinking',
        'sequential_thinking': 'sequentialthinking',
        'mcp-server-sequential-thinking': 'sequentialthinking',
        'postgres-mcp': 'postgres',
        'mcp-server-postgres': 'postgres',
        'mcp-server-github': 'github',
        'github-mcp-server': 'github',
        'mcp-server-git': 'git',
        'mcp-server-fetch': 'fetch',
        'mcp-server-filesystem': 'filesystem',
        'mcp-server-memory': 'memory',
        'mcp-server-puppeteer': 'puppeteer',
        'mcp-server-sqlite': 'sqlite',
        'mcp-server-slack': 'slack',
        'mcp-server-everything': 'everything',
        'google-drive': 'googledrive',
        'gdrive': 'googledrive',
        'google-maps': 'googlemaps',
        'brave-search': 'bravesearch',
    };

    /**
     * Known MCP server name "stems", longest-first, used to correctly split
     * opencode-style tool names ("<mcp>_<tool>") when the server name itself
     * contains an underscore-adjacent hyphenated word (e.g. "sequential-thinking").
     * Not required for single-word servers like "context7" or "github", but
     * keeps multi-word server names from being mis-split.
     */
    private readonly MCP_NAME_STEMS: string[] = [
        'sequential-thinking',
        'sequentialthinking',
        'google-drive',
        'google-maps',
        'brave-search',
        'postgres-mcp',
    ];

    resolveBrand(model: string | null | undefined, provider: string | null | undefined): Brand {
        const modelStr = (model || '').trim();
        const providerStr = (provider || '').trim();

        // 1. Try to resolve a logo from the MODEL first — either because the
        //    model name itself matches a FAVICONS key (e.g. "gemini-1.5-pro"),
        //    or because it starts with a known model prefix (e.g. "gpt-4o",
        //    "claude-opus-4").
        let src = this.matchLogo(modelStr, this.FAVICONS)
            ?? this.matchLogo(this.providerFromModelPrefix(modelStr), this.FAVICONS);

        // 2. Fall back to the explicit provider, if given.
        if (!src) {
            src = this.matchLogo(providerStr, this.FAVICONS);
        }

        // 3. Final fallback: generic icon.
        if (!src) {
            src = this.FALLBACK_LOGO;
        }

        const providerName = providerStr || this.providerFromModelPrefix(modelStr) || modelStr;
        return { logo: src, name: providerName };
    }

    /** Resolve a Brand directly from an MCP server name (e.g. "context7", "sequential-thinking"). */
    resolveMcpBrand(name: string | null | undefined): Brand {
        const raw = (name || 'opencode').trim();
        const src = this.matchLogo(raw, this.MCP_FAVICONS, this.MCP_ALIASES) ?? this.FALLBACK_LOGO;
        return { logo: src, name: raw };
    }

    /**
     * Maps a model string to a provider name using ONLY the model's own
     * prefix or "<provider>/<model>" convention — never looks at an
     * explicit `provider` argument. Used as the second step of the
     * model-first lookup in resolveBrand().
     */
    private providerFromModelPrefix(model: string): string {
        if (!model) return '';
        const slash = model.indexOf('/');
        if (slash > 0) return model.slice(0, slash);
        const lower = model.toLowerCase();
        for (const [prefix, name] of Object.entries(this.MODEL_PREFIXES)) {
            if (lower.startsWith(prefix)) return name;
        }
        return '';
    }

    /**
     * Normalizes `raw` (lowercase, strip non-alphanumerics), resolves it through
     * an optional alias table, then finds the best matching logo in `table`.
     * Exact match wins; otherwise the first key (in the table's insertion /
     * priority order) that the normalized input starts with is used.
     */
    private matchLogo(raw: string, table: Record<string, string>, aliases?: Record<string, string>): string | null {
        if (!raw) return null;
        const rawNorm = raw.toLowerCase().trim();
        const resolved = aliases?.[rawNorm] ?? rawNorm;
        const norm = resolved.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!norm) return null;

        if (table[norm]) return table[norm];

        for (const key of Object.keys(table)) {
            if (norm === key || norm.startsWith(key)) {
                return table[key];
            }
        }
        return null;
    }
}