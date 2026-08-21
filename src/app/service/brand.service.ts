import { Injectable } from "@angular/core";
import { Brand } from "@agentspyglass/core";

@Injectable({ providedIn: "root" })
export class BrandService {

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
        microsoft: 'https://www.microsoft.com/favicon.ico',
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
        ai21: 'https://www.ai21.com/favicon.ico',
        databricks: 'https://www.databricks.com/favicon.ico',
        ibm: 'https://www.ibm.com/favicon.ico',
        watsonx: 'https://www.ibm.com/favicon.ico',
        stabilityai: 'https://stability.ai/favicon.ico',
        stability: 'https://stability.ai/favicon.ico',
        zhipuai: 'https://www.zhipuai.cn/favicon.ico',
        glm: 'https://www.zhipuai.cn/favicon.ico',
        baidu: 'https://www.baidu.com/favicon.ico',
        ernie: 'https://www.baidu.com/favicon.ico',
        '01ai': 'https://www.01.ai/favicon.ico',
        yi: 'https://www.01.ai/favicon.ico',
        reka: 'https://www.reka.ai/favicon.ico',
        snowflake: 'https://www.snowflake.com/favicon.ico',
        ai2: 'https://allenai.org/favicon.ico',
        moonshot: 'https://www.moonshot.cn/favicon.ico',
        fireworks: 'https://fireworks.ai/favicon.ico',
        anyscale: 'https://www.anyscale.com/favicon.ico',
        replicate: 'https://replicate.com/favicon.ico',
        cerebras: 'https://www.cerebras.ai/favicon.ico',
        sambanova: 'https://sambanova.ai/favicon.ico',
        inflection: 'https://inflection.ai/favicon.ico',
        writer: 'https://writer.com/favicon.ico',
        nousresearch: 'https://nousresearch.com/favicon.ico',
        voyageai: 'https://www.voyageai.com/favicon.ico',
        jina: 'https://jina.ai/favicon.ico',
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
        'pixtral-': 'mistral',
        'codestral-': 'mistral',
        'llama-': 'meta',
        'grok-': 'xai',
        'qwen-': 'qwen',
        'command-': 'cohere',
        'sonar-': 'perplexity',
        'phi-': 'microsoft',
        'dbrx-': 'databricks',
        'granite-': 'ibm',
        'ernie-': 'baidu',
        'glm-': 'zhipuai',
        'yi-': '01ai',
        'jamba-': 'ai21',
        'reka-': 'reka',
        'olmo-': 'ai2',
        'arctic-': 'snowflake',
        'stablelm-': 'stabilityai',
        'moonshot-': 'moonshot',
        'nemotron-': 'nvidia',
    };

    private readonly MCP_FAVICONS: Record<string, string> = {
        opencode: 'https://opencode.ai/favicon.ico',

        context7: 'https://context7.com/favicon.ico',
        bruno: 'https://www.usebruno.com/favicon.ico',
        github: 'https://github.com/favicon.ico',
        playwright: 'https://playwright.dev/img/playwright-logo.svg',
        postgres: 'https://www.postgresql.org/favicon.ico',
        postgresql: 'https://www.postgresql.org/favicon.ico',
        serena: 'https://raw.githubusercontent.com/oraios/serena/main/resources/serena-icon.svg',
        sequentialthinking: 'https://modelcontextprotocol.io/favicon.ico',

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
        googlecalendar: 'https://calendar.google.com/favicon.ico',
        googlesheets: 'https://sheets.google.com/favicon.ico',
        gmail: 'https://mail.google.com/favicon.ico',
        bravesearch: 'https://brave.com/favicon.ico',
        brave: 'https://brave.com/favicon.ico',
        jira: 'https://www.atlassian.com/favicon.ico',
        confluence: 'https://www.atlassian.com/favicon.ico',
        atlassian: 'https://www.atlassian.com/favicon.ico',
        heroku: 'https://www.heroku.com/favicon.ico',
        netlify: 'https://www.netlify.com/favicon.ico',
        digitalocean: 'https://www.digitalocean.com/favicon.ico',
        npm: 'https://www.npmjs.com/favicon.ico',
        zapier: 'https://zapier.com/favicon.ico',
        asana: 'https://asana.com/favicon.ico',
        trello: 'https://trello.com/favicon.ico',
        airtable: 'https://airtable.com/favicon.ico',
        discord: 'https://discord.com/favicon.ico',
        telegram: 'https://telegram.org/favicon.ico',
        salesforce: 'https://www.salesforce.com/favicon.ico',
        hubspot: 'https://www.hubspot.com/favicon.ico',
        zendesk: 'https://www.zendesk.com/favicon.ico',
        shopify: 'https://www.shopify.com/favicon.ico',
        twilio: 'https://www.twilio.com/favicon.ico',
        sendgrid: 'https://sendgrid.com/favicon.ico',
        grafana: 'https://grafana.com/favicon.ico',
        datadog: 'https://www.datadoghq.com/favicon.ico',
        pagerduty: 'https://www.pagerduty.com/favicon.ico',
        circleci: 'https://circleci.com/favicon.ico',
        terraform: 'https://www.terraform.io/favicon.ico',
        bigquery: 'https://cloud.google.com/favicon.ico',
        clickhouse: 'https://clickhouse.com/favicon.ico',
        neon: 'https://neon.tech/favicon.ico',
        planetscale: 'https://planetscale.com/favicon.ico',
        railway: 'https://railway.app/favicon.ico',
        render: 'https://render.com/favicon.ico',
        apify: 'https://apify.com/favicon.ico',
        exa: 'https://exa.ai/favicon.ico',
        tavily: 'https://tavily.com/favicon.ico',
        browserbase: 'https://www.browserbase.com/favicon.ico',
        e2b: 'https://e2b.dev/favicon.ico',
        perplexity: 'https://www.perplexity.ai/favicon.ico',
        youtube: 'https://www.youtube.com/favicon.ico',
        spotify: 'https://www.spotify.com/favicon.ico',
        pinecone: 'https://www.pinecone.io/favicon.ico',
        weaviate: 'https://weaviate.io/favicon.ico',
        qdrant: 'https://qdrant.tech/favicon.ico',
        chroma: 'https://www.trychroma.com/favicon.ico',
        zoom: 'https://zoom.us/favicon.ico',
    };

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
        'google-calendar': 'googlecalendar',
        'google-sheets': 'googlesheets',
        'brave-search': 'bravesearch',
        'circle-ci': 'circleci',
        'e2b-code-interpreter': 'e2b',
    };

    resolveBrand(model: string | null | undefined, provider: string | null | undefined): Brand {
        const modelStr = (model || '').trim();
        const providerStr = (provider || '').trim();

        let src = this.matchLogo(modelStr, this.FAVICONS)
            ?? this.matchLogo(this.providerFromModelPrefix(modelStr), this.FAVICONS);

        if (!src) {
            src = this.matchLogo(providerStr, this.FAVICONS);
        }

        if (!src) {
            src = 'assets/agent_not_found.svg';
        }

        const providerName = providerStr || this.providerFromModelPrefix(modelStr) || modelStr;
        return { logo: src, name: providerName };
    }

    resolveMcpBrand(name: string | null | undefined): Brand {
        const raw = (name || 'opencode').trim();
        const src = this.matchLogo(raw, this.MCP_FAVICONS, this.MCP_ALIASES) ?? this.MCP_FAVICONS['opencode'];
        return { logo: src, name: raw };
    }

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