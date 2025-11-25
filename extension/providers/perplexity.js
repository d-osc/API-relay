
// extension/providers/chatgpt.js
(async function () {
  'use strict';
  if (window.location.hostname === 'www.perplexity.ai') {
    function createState(initialValue) {
      let value = initialValue;
      const listeners = new Set();

      function get() {
        return value;
      }

      function set(newValue) {
        // ถ้าไม่เปลี่ยนจริงๆ ก็ไม่แจ้งเตือน
        if (Object.is(newValue, value)) return;
        value = newValue;
        // แจ้งทุก listener ให้รีเรนเดอร์ใหม่
        listeners.forEach(fn => fn(value));
      }

      function subscribe(listener) {
        listeners.add(listener);
        // ให้ยิงครั้งแรกด้วยค่าเริ่มต้น
        listener(value);
        // คืนฟังก์ชัน unsubscribe
        return () => listeners.delete(listener);
      }

      return { get, set, subscribe };
    }

    const modelState = createState("turbo");
    const allModelState = createState([]);

    async function getPerplexityModels() {
      return new Promise((resolve) => {
        var model_id;
        (function (e) {
          e.DEFAULT = "turbo",
            e.PPLX_PRO_UPGRADED = "pplx_pro_upgraded",
            e.PRO = "pplx_pro",
            e.SONAR = "experimental",
            e.GPT_4o = "gpt4o",
            e.GPT_4_1 = "gpt41",
            e.GPT_5_1 = "gpt51",
            e.CLAUDE_2 = "claude2",
            e.GEMINI_2_5_PRO = "gemini25pro",
            e.GEMINI_3_0_PRO = "gemini30pro",
            e.GROK = "grok",
            e.PPLX_REASONING = "pplx_reasoning",
            e.CLAUDE_3_7_SONNET_THINKING = "claude37sonnetthinking",
            e.O4_MINI = "o4mini",
            e.O3_PRO = "o3pro",
            e.GPT_5_1_THINKING = "gpt51_thinking",
            e.CLAUDE_4_0_OPUS = "claude40opus",
            e.CLAUDE_4_1_OPUS = "claude41opus",
            e.CLAUDE_4_5_OPUS = "claude45opus",
            e.CLAUDE_4_0_OPUS_THINKING = "claude40opusthinking",
            e.CLAUDE_4_1_OPUS_THINKING = "claude41opusthinking",
            e.CLAUDE_4_5_OPUS_THINKING = "claude45opusthinking",
            e.CLAUDE_4_5_SONNET = "claude45sonnet",
            e.CLAUDE_4_5_SONNET_THINKING = "claude45sonnetthinking",
            e.KIMI_K2_THINKING = "kimik2thinking",
            e.GROK_4 = "grok4",
            e.GROK_4_NON_THINKING = "grok4nonthinking",
            e.GROK_4_1_REASONING = "grok41reasoning",
            e.GROK_4_1_NON_REASONING = "grok41nonreasoning",
            e.PPLX_SONAR_INTERNAL_TESTING = "pplx_sonar_internal_testing",
            e.PPLX_SONAR_INTERNAL_TESTING_V2 = "pplx_sonar_internal_testing_v2",
            e.TESTING_MODEL_C = "testing_model_c",
            e.ALPHA = "pplx_alpha",
            e.O3_RESEARCH = "o3_research",
            e.O3_PRO_RESEARCH = "o3pro_research",
            e.CLAUDE40SONNET_RESEARCH = "claude40sonnet_research",
            e.CLAUDE40SONNETTHINKING_RESEARCH = "claude40sonnetthinking_research",
            e.CLAUDE40OPUS_RESEARCH = "claude40opus_research",
            e.CLAUDE40OPUSTHINKING_RESEARCH = "claude40opusthinking_research",
            e.BETA = "pplx_beta",
            e.O3_LABS = "o3_labs",
            e.O3_PRO_LABS = "o3pro_labs",
            e.CLAUDE40SONNETTHINKING_LABS = "claude40sonnetthinking_labs",
            e.CLAUDE40OPUSTHINKING_LABS = "claude40opusthinking_labs",
            e.STUDY = "pplx_study",
            e.GPT_4 = "gpt4",
            e.CLAUDE_3_OPUS = "claude3opus",
            e.CLAUDE_3_5_HAIKU = "claude35haiku",
            e.GEMINI = "gemini",
            e.LLAMA_X_LARGE = "llama_x_large",
            e.MISTRAL = "mistral",
            e.GROK2 = "grok2",
            e.COPILOT = "copilot",
            e.O3_MINI = "o3mini",
            e.CLAUDE_OMBRE_EAP = "claude_ombre_eap",
            e.CLAUDE_LACE_EAP = "claude_lace_eap",
            e.R1 = "r1",
            e.GAMMA = "pplx_gamma",
            e.O3 = "o3",
            e.GEMINI_2_FLASH = "gemini2flash",
            e.GPT_5 = "gpt5",
            e.GPT_5_THINKING = "gpt5_thinking",
            e.GPT5_PRO = "gpt5_pro"
        }
        )(model_id || (model_id = {}));

        var tool;
        (function (e) {
          e.SEARCH = "search",
            e.RESEARCH = "research",
            e.STUDIO = "studio",
            e.STUDY = "study"
        }
        )(tool || (tool = {}));


        const model_types = {
          [model_id.DEFAULT]: tool.SEARCH,
          [model_id.PPLX_PRO_UPGRADED]: tool.SEARCH,
          [model_id.PRO]: tool.SEARCH,
          [model_id.SONAR]: tool.SEARCH,
          [model_id.CLAUDE_2]: tool.SEARCH,
          [model_id.CLAUDE_4_5_SONNET]: tool.SEARCH,
          [model_id.CLAUDE_4_5_SONNET_THINKING]: tool.SEARCH,
          [model_id.KIMI_K2_THINKING]: tool.SEARCH,
          [model_id.GPT_4o]: tool.SEARCH,
          [model_id.GPT_4_1]: tool.SEARCH,
          [model_id.GPT_5_1]: tool.SEARCH,
          [model_id.GEMINI_2_5_PRO]: tool.SEARCH,
          [model_id.GEMINI_3_0_PRO]: tool.SEARCH,
          [model_id.GROK]: tool.SEARCH,
          [model_id.PPLX_REASONING]: tool.SEARCH,
          [model_id.O3_PRO]: tool.SEARCH,
          [model_id.CLAUDE_3_7_SONNET_THINKING]: tool.SEARCH,
          [model_id.CLAUDE_4_0_OPUS]: tool.SEARCH,
          [model_id.CLAUDE_4_0_OPUS_THINKING]: tool.SEARCH,
          [model_id.CLAUDE_4_1_OPUS]: tool.SEARCH,
          [model_id.CLAUDE_4_1_OPUS_THINKING]: tool.SEARCH,
          [model_id.CLAUDE_4_5_OPUS]: tool.SEARCH,
          [model_id.CLAUDE_4_5_OPUS_THINKING]: tool.SEARCH,
          [model_id.GROK_4]: tool.SEARCH,
          [model_id.GROK_4_NON_THINKING]: tool.SEARCH,
          [model_id.GROK_4_1_REASONING]: tool.SEARCH,
          [model_id.GROK_4_1_NON_REASONING]: tool.SEARCH,
          [model_id.GPT_5_1_THINKING]: tool.SEARCH,
          [model_id.PPLX_SONAR_INTERNAL_TESTING]: tool.SEARCH,
          [model_id.PPLX_SONAR_INTERNAL_TESTING_V2]: tool.SEARCH,
          [model_id.TESTING_MODEL_C]: tool.SEARCH,
          [model_id.GPT_5_THINKING]: tool.SEARCH,
          [model_id.GPT_5]: tool.SEARCH,
          [model_id.GPT5_PRO]: tool.SEARCH,
          [model_id.GPT_4]: tool.SEARCH,
          [model_id.CLAUDE_3_OPUS]: tool.SEARCH,
          [model_id.CLAUDE_3_5_HAIKU]: tool.SEARCH,
          [model_id.GEMINI]: tool.SEARCH,
          [model_id.LLAMA_X_LARGE]: tool.SEARCH,
          [model_id.MISTRAL]: tool.SEARCH,
          [model_id.GROK2]: tool.SEARCH,
          [model_id.COPILOT]: tool.SEARCH,
          [model_id.O3_MINI]: tool.SEARCH,
          [model_id.CLAUDE_OMBRE_EAP]: tool.SEARCH,
          [model_id.CLAUDE_LACE_EAP]: tool.SEARCH,
          [model_id.R1]: tool.SEARCH,
          [model_id.GAMMA]: tool.SEARCH,
          [model_id.O3]: tool.SEARCH,
          [model_id.GEMINI_2_FLASH]: tool.SEARCH,
          [model_id.ALPHA]: tool.RESEARCH,
          [model_id.O4_MINI]: tool.RESEARCH,
          [model_id.O3_RESEARCH]: tool.RESEARCH,
          [model_id.O3_PRO_RESEARCH]: tool.RESEARCH,
          [model_id.CLAUDE40SONNET_RESEARCH]: tool.RESEARCH,
          [model_id.CLAUDE40SONNETTHINKING_RESEARCH]: tool.RESEARCH,
          [model_id.CLAUDE40OPUS_RESEARCH]: tool.RESEARCH,
          [model_id.CLAUDE40OPUSTHINKING_RESEARCH]: tool.RESEARCH,
          [model_id.BETA]: tool.STUDIO,
          [model_id.O3_LABS]: tool.STUDIO,
          [model_id.O3_PRO_LABS]: tool.STUDIO,
          [model_id.CLAUDE40SONNETTHINKING_LABS]: tool.STUDIO,
          [model_id.CLAUDE40OPUSTHINKING_LABS]: tool.STUDIO,
          [model_id.STUDY]: tool.STUDY
        }

        function ObjectFunc(e) {
          return e
        }

        const all_model_names = {
          [model_id.DEFAULT]: ObjectFunc({
            name: {
              defaultMessage: "Best",
              id: "PzlMqGwwkm"
            },
            description: {
              defaultMessage: "Adapts to each query",
              id: "SsTMNu/s/A"
            }
          }),
          [model_id.PRO]: ObjectFunc({
            name: {
              defaultMessage: "Best",
              id: "PzlMqGwwkm"
            },
            description: {
              defaultMessage: "Automatically selects the best model based on the query",
              id: "3ZgFQznYO0"
            }
          }),
          [model_id.PPLX_PRO_UPGRADED]: ObjectFunc({
            name: {
              defaultMessage: "Pro",
              id: "R/eOkjWqNU"
            },
            description: {
              defaultMessage: "Automatically selects the most responsive model based on the query",
              id: "DuOz+H05Us"
            }
          }),
          [model_id.SONAR]: ObjectFunc({
            name: {
              defaultMessage: "Sonar",
              id: "sT9VX563o6"
            },
            description: {
              defaultMessage: "Perplexity's fast model",
              id: "pdbURewz6Q"
            }
          }),
          [model_id.GPT_4o]: ObjectFunc({
            name: {
              defaultMessage: "GPT-4o",
              id: "nebbHBgxX/"
            },
            description: {
              defaultMessage: "OpenAI's versatile model",
              id: "zdAw82CyOA"
            }
          }),
          [model_id.GPT_4_1]: ObjectFunc({
            name: {
              defaultMessage: "GPT-4.1",
              id: "+LPr/f6Fal"
            },
            description: {
              defaultMessage: "OpenAI's advanced model",
              id: "+uCLZVt7uh"
            }
          }),
          [model_id.GPT_5]: ObjectFunc({
            name: {
              defaultMessage: "GPT-5",
              id: "VfhmdGpVc7"
            },
            description: {
              defaultMessage: "OpenAI's latest model",
              id: "5VYr+wSh/Y"
            }
          }),
          [model_id.GPT_5_1]: ObjectFunc({
            name: {
              defaultMessage: "GPT-5.1",
              id: "uOMpo0agAL"
            },
            description: {
              defaultMessage: "OpenAI's latest model",
              id: "5VYr+wSh/Y"
            }
          }),
          [model_id.GPT_5_THINKING]: ObjectFunc({
            name: {
              defaultMessage: "GPT-5 Thinking",
              id: "/IA3KV+qFr"
            },
            description: {
              defaultMessage: "OpenAI's latest model with thinking",
              id: "r+tIMgEnyZ"
            }
          }),
          [model_id.GPT_5_1_THINKING]: ObjectFunc({
            name: {
              defaultMessage: "GPT-5.1 Thinking",
              id: "74//SO976H"
            },
            description: {
              defaultMessage: "OpenAI's latest model with thinking",
              id: "r+tIMgEnyZ"
            }
          }),
          [model_id.GPT5_PRO]: ObjectFunc({
            name: {
              defaultMessage: "GPT-5 Pro",
              id: "GwvubEn/BR"
            },
            description: {
              defaultMessage: "OpenAI's latest, most powerful reasoning model",
              id: "3Z57hOWKDd"
            }
          }),
          [model_id.CLAUDE_2]: ObjectFunc({
            name: {
              defaultMessage: "Claude Sonnet 4.0",
              id: "4UrgPEhdwq"
            },
            description: {
              defaultMessage: "Anthropic's advanced model",
              id: "b5CqfvLw4b"
            }
          }),
          [model_id.GEMINI_2_5_PRO]: ObjectFunc({
            name: {
              defaultMessage: "Gemini 2.5 Pro",
              id: "hec4NYL1Ib"
            },
            description: {
              defaultMessage: "Google's latest model",
              id: "XBL8FigIeX"
            }
          }),
          [model_id.GEMINI_3_0_PRO]: ObjectFunc({
            name: {
              defaultMessage: "Gemini 3 Pro",
              id: "UK0QXlryM2"
            },
            description: {
              defaultMessage: "Google's newest reasoning model",
              id: "SG9sq36RHL"
            }
          }),
          [model_id.GROK]: ObjectFunc({
            name: {
              defaultMessage: "Grok 3 Beta",
              id: "Ybq0GDRm0J"
            },
            description: {
              defaultMessage: "xAI's Grok 3 model",
              id: "gwIHPQy1c/"
            }
          }),
          [model_id.PPLX_REASONING]: ObjectFunc({
            name: {
              defaultMessage: "Reasoning",
              id: "Aw3qRf7hyO"
            },
            description: {
              defaultMessage: "Advanced problem solving",
              id: "4J0akc6m53"
            }
          }),
          [model_id.CLAUDE_3_7_SONNET_THINKING]: ObjectFunc({
            name: {
              defaultMessage: "Claude Sonnet 4.0 Thinking",
              id: "a3LiLxX42G"
            },
            description: {
              defaultMessage: "Anthropic's reasoning model",
              id: "vRfGVNHXG3"
            }
          }),
          [model_id.CLAUDE_4_0_OPUS]: ObjectFunc({
            name: {
              defaultMessage: "Claude Opus 4.0",
              id: "fwViXd5wrs"
            },
            description: {
              defaultMessage: "Anthropic's Opus reasoning model",
              id: "e0FjrIe1O/"
            }
          }),
          [model_id.CLAUDE_4_0_OPUS_THINKING]: ObjectFunc({
            name: {
              defaultMessage: "Claude Opus 4.0 Thinking",
              id: "hwrQNTIYLG"
            },
            description: {
              defaultMessage: "Anthropic's Opus reasoning model with thinking",
              id: "ipx+1wZCy6"
            }
          }),
          [model_id.CLAUDE_4_1_OPUS]: ObjectFunc({
            name: {
              defaultMessage: "Claude Opus 4.1",
              id: "aq+8T//8S9"
            },
            description: {
              defaultMessage: "Anthropic's Opus reasoning model",
              id: "e0FjrIe1O/"
            }
          }),
          [model_id.CLAUDE_4_1_OPUS_THINKING]: ObjectFunc({
            name: {
              defaultMessage: "Claude Opus 4.1 Thinking",
              id: "Vd2LxNSW/4"
            },
            description: {
              defaultMessage: "Anthropic's Opus reasoning model with thinking",
              id: "ipx+1wZCy6"
            }
          }),
          [model_id.CLAUDE_4_5_OPUS]: ObjectFunc({
            name: {
              defaultMessage: "Claude Opus 4.5",
              id: "c8oGQdxIXE"
            },
            description: {
              defaultMessage: "Anthropic's Opus reasoning model",
              id: "e0FjrIe1O/"
            }
          }),
          [model_id.CLAUDE_4_5_OPUS_THINKING]: ObjectFunc({
            name: {
              defaultMessage: "Claude Opus 4.5 Thinking",
              id: "oBSH9hOxZC"
            },
            description: {
              defaultMessage: "Anthropic's Opus reasoning model with thinking",
              id: "ipx+1wZCy6"
            }
          }),
          [model_id.CLAUDE_4_5_SONNET]: ObjectFunc({
            name: {
              defaultMessage: "Claude Sonnet 4.5",
              id: "TreRV15OSF"
            },
            description: {
              defaultMessage: "Anthropic's newest advanced model",
              id: "yVLNWskqHe"
            }
          }),
          [model_id.CLAUDE_4_5_SONNET_THINKING]: ObjectFunc({
            name: {
              defaultMessage: "Claude Sonnet 4.5 Thinking",
              id: "POJuSUD1gU"
            },
            description: {
              defaultMessage: "Anthropic's newest reasoning model",
              id: "MIjO2w9Cui"
            }
          }),
          [model_id.KIMI_K2_THINKING]: ObjectFunc({
            name: {
              defaultMessage: "Kimi K2 Thinking",
              id: "IIsFX2aoN0"
            },
            description: {
              defaultMessage: "Moonshot AI's latest reasoning model",
              id: "KFOkH3dSUa"
            }
          }),
          [model_id.GROK_4]: ObjectFunc({
            name: {
              defaultMessage: "Grok 4",
              id: "+Y775fAOqr"
            },
            description: {
              defaultMessage: "xAI's reasoning model",
              id: "tYRPjba3cL"
            }
          }),
          [model_id.GROK_4_NON_THINKING]: ObjectFunc({
            name: {
              defaultMessage: "Grok 4",
              id: "+Y775fAOqr"
            },
            description: {
              defaultMessage: "xAI's advanced model",
              id: "av1iNKEP7e"
            }
          }),
          [model_id.GROK_4_1_REASONING]: ObjectFunc({
            name: {
              defaultMessage: "Grok 4.1",
              id: "gWMQFuyUxZ"
            },
            description: {
              defaultMessage: "xAI's latest reasoning model",
              id: "BVUpDXsBWU"
            }
          }),
          [model_id.GROK_4_1_NON_REASONING]: ObjectFunc({
            name: {
              defaultMessage: "Grok 4.1",
              id: "gWMQFuyUxZ"
            },
            description: {
              defaultMessage: "xAI's latest advanced model",
              id: "+gMdtUmDTB"
            }
          }),
          [model_id.O3_PRO]: ObjectFunc({
            name: {
              defaultMessage: "o3-pro",
              id: "lyV2e5kFYG"
            },
            description: {
              defaultMessage: "OpenAI's powerful reasoning model",
              id: "BodLv+J6l0"
            }
          }),
          [model_id.O4_MINI]: ObjectFunc({
            name: {
              defaultMessage: "o4-mini",
              id: "BwwjXFHgz7"
            },
            description: {
              defaultMessage: "OpenAI's latest reasoning model",
              id: "VKonAfIZbf"
            }
          }),
          [model_id.PPLX_SONAR_INTERNAL_TESTING]: ObjectFunc({
            name: {
              defaultMessage: "Sonar Testing - Alpha",
              id: "2oa4bWRfNL"
            },
            description: {
              defaultMessage: "Sonar model alpha variant",
              id: "EvwN/e7vAD"
            }
          }),
          [model_id.PPLX_SONAR_INTERNAL_TESTING_V2]: ObjectFunc({
            name: {
              defaultMessage: "Sonar Testing - Beta",
              id: "VNsK+ZGei/"
            },
            description: {
              defaultMessage: "Sonar model beta variant",
              id: "Dzfl36DNyM"
            }
          }),
          [model_id.TESTING_MODEL_C]: ObjectFunc({
            name: {
              defaultMessage: "Testing Model C",
              id: "sgSu9ApFvP"
            },
            description: {
              defaultMessage: "Debug model for testing",
              id: "AG6p6ERvyn"
            }
          }),
          [model_id.ALPHA]: ObjectFunc({
            name: {
              defaultMessage: "Research",
              id: "JEe7dVso7F"
            },
            description: {
              defaultMessage: "Fast and thorough for routine research",
              id: "v/MuahlVJE"
            }
          }),
          [model_id.O3_RESEARCH]: ObjectFunc({
            name: {
              defaultMessage: "o3",
              id: "BBaBURoUEg"
            },
            description: {
              defaultMessage: "OpenAI's reasoning model",
              id: "V9t5CKw8kf"
            }
          }),
          [model_id.O3_PRO_RESEARCH]: ObjectFunc({
            name: {
              defaultMessage: "o3-pro",
              id: "lyV2e5kFYG"
            },
            description: {
              defaultMessage: "OpenAI's most powerful reasoning model",
              id: "1ntkiZj5rM"
            }
          }),
          [model_id.CLAUDE40SONNET_RESEARCH]: ObjectFunc({
            name: {
              defaultMessage: "Claude Sonnet 4.0",
              id: "4UrgPEhdwq"
            },
            description: {
              defaultMessage: "Anthropic's advanced model",
              id: "b5CqfvLw4b"
            }
          }),
          [model_id.CLAUDE40SONNETTHINKING_RESEARCH]: ObjectFunc({
            name: {
              defaultMessage: "Claude Sonnet 4.0 Thinking",
              id: "a3LiLxX42G"
            },
            description: {
              defaultMessage: "Anthropic's reasoning model",
              id: "vRfGVNHXG3"
            }
          }),
          [model_id.CLAUDE40OPUS_RESEARCH]: ObjectFunc({
            name: {
              defaultMessage: "Claude Opus 4.0",
              id: "fwViXd5wrs"
            },
            description: {
              defaultMessage: "Anthropic's most advanced model",
              id: "4l6C+Dcw8g"
            }
          }),
          [model_id.CLAUDE40OPUSTHINKING_RESEARCH]: ObjectFunc({
            name: {
              defaultMessage: "Claude Opus 4.0 Thinking",
              id: "hwrQNTIYLG"
            },
            description: {
              defaultMessage: "Anthropic's advanced reasoning model",
              id: "RwUx0WhdZb"
            }
          }),
          [model_id.BETA]: ObjectFunc({
            name: {
              defaultMessage: "Labs",
              id: "ylFNoY79wa"
            },
            description: {
              defaultMessage: "Multi-step tasks with advanced troubleshooting",
              id: "Sf0AeuilA5"
            }
          }),
          [model_id.O3_LABS]: ObjectFunc({
            name: {
              defaultMessage: "o3",
              id: "BBaBURoUEg"
            },
            description: {
              defaultMessage: "OpenAI's reasoning model",
              id: "V9t5CKw8kf"
            }
          }),
          [model_id.O3_PRO_LABS]: ObjectFunc({
            name: {
              defaultMessage: "o3-pro",
              id: "lyV2e5kFYG"
            },
            description: {
              defaultMessage: "OpenAI's most powerful reasoning model",
              id: "1ntkiZj5rM"
            }
          }),
          [model_id.CLAUDE40SONNETTHINKING_LABS]: ObjectFunc({
            name: {
              defaultMessage: "Claude Sonnet 4.0 Thinking",
              id: "a3LiLxX42G"
            },
            description: {
              defaultMessage: "Anthropic's reasoning model",
              id: "vRfGVNHXG3"
            }
          }),
          [model_id.CLAUDE40OPUSTHINKING_LABS]: ObjectFunc({
            name: {
              defaultMessage: "Claude Opus 4.0 Thinking",
              id: "hwrQNTIYLG"
            },
            description: {
              defaultMessage: "Anthropic's advanced reasoning model",
              id: "RwUx0WhdZb"
            }
          }),
          [model_id.STUDY]: ObjectFunc({
            name: {
              defaultMessage: "Study",
              id: "UTFsoN8Z1P"
            },
            description: {
              defaultMessage: "Fast model for routine research",
              id: "prWIV9FsWt"
            }
          }),
          [model_id.O3_MINI]: ObjectFunc({
            name: {
              defaultMessage: "o3-mini",
              id: "GdJwPgWWId"
            },
            description: {
              defaultMessage: "OpenAI's reasoning model",
              id: "V9t5CKw8kf"
            }
          }),
          [model_id.GROK2]: ObjectFunc({
            name: {
              defaultMessage: "Grok-2",
              id: "9X3jPx+0vk"
            },
            description: {
              defaultMessage: "xAI's latest model",
              id: "e2CghRZC7d"
            }
          }),
          [model_id.GPT_4]: ObjectFunc({
            name: {
              defaultMessage: "GPT-4",
              id: "6TGiMlP7f4"
            },
            description: {
              defaultMessage: "OpenAI's previous generation model",
              id: "U3OQoJ211e"
            }
          }),
          [model_id.CLAUDE_3_OPUS]: ObjectFunc({
            name: {
              defaultMessage: "Claude 3 Opus",
              id: "gLSCHWGsu1"
            },
            description: {
              defaultMessage: "Anthropic's previous generation model",
              id: "hAevdn8yGl"
            }
          }),
          [model_id.CLAUDE_3_5_HAIKU]: ObjectFunc({
            name: {
              defaultMessage: "Claude 3.5 Haiku",
              id: "zEJWYa05R2"
            },
            description: {
              defaultMessage: "Anthropic's smaller model",
              id: "pQia6E7J8i"
            }
          }),
          [model_id.GEMINI]: ObjectFunc({
            name: {
              defaultMessage: "Gemini",
              id: "XoqZkcqFZ/"
            },
            description: {
              defaultMessage: "Previous version of Google's Gemini model",
              id: "9C0LtRWLFh"
            }
          }),
          [model_id.LLAMA_X_LARGE]: ObjectFunc({
            name: {
              defaultMessage: "Llama X Large",
              id: "2zxgnSWUyX"
            },
            description: {
              defaultMessage: "Meta's large Llama model",
              id: "+95UnVOxgQ"
            }
          }),
          [model_id.MISTRAL]: ObjectFunc({
            name: {
              defaultMessage: "Mistral",
              id: "dUBSpMbbs4"
            },
            description: {
              defaultMessage: "Mistral AI model",
              id: "rYRyt8I2Zr"
            }
          }),
          [model_id.COPILOT]: ObjectFunc({
            name: {
              defaultMessage: "Copilot",
              id: "b3QbnXgawD"
            },
            description: {
              defaultMessage: "Legacy Pro Search",
              id: "pg83InaW1o"
            }
          }),
          [model_id.CLAUDE_OMBRE_EAP]: ObjectFunc({
            name: {
              defaultMessage: "Claude Ombre",
              id: "F12IlTx8R1"
            },
            description: {
              defaultMessage: "Anthropic's research preview",
              id: "LKt7UBXwdw"
            }
          }),
          [model_id.CLAUDE_LACE_EAP]: ObjectFunc({
            name: {
              defaultMessage: "Claude Lace",
              id: "8ydOdGYWef"
            },
            description: {
              defaultMessage: "Anthropic's opus research preview",
              id: "GHW8xWfe9i"
            }
          }),
          [model_id.R1]: ObjectFunc({
            name: {
              defaultMessage: "R1 1776",
              id: "e8N3MYqmIQ"
            },
            description: {
              defaultMessage: "Perplexity's unbiased reasoning model",
              id: "R5Tg1hC1um"
            }
          }),
          [model_id.GAMMA]: ObjectFunc({
            name: {
              defaultMessage: "Gamma",
              id: "Wb9IyuuCJO"
            },
            description: {
              defaultMessage: "Fast model for routine research",
              id: "prWIV9FsWt"
            }
          }),
          [model_id.O3]: ObjectFunc({
            name: {
              defaultMessage: "o3",
              id: "BBaBURoUEg"
            },
            description: {
              defaultMessage: "OpenAI's reasoning model",
              id: "V9t5CKw8kf"
            }
          }),
          [model_id.GEMINI_2_FLASH]: ObjectFunc({
            name: {
              defaultMessage: "Gemini 2.5 Pro",
              id: "hec4NYL1Ib"
            },
            description: {
              defaultMessage: "Google's latest model",
              id: "XBL8FigIeX"
            }
          })
        }

        const models = Object.values(model_id).map(id => {
          return {
            id: id,
            title: all_model_names[id].name.defaultMessage,
            description: all_model_names[id].description.defaultMessage,
            enabledTools: model_types[id] === tool.SEARCH ? ['tools', 'tools2', 'search', 'canvas', 'image_gen_tool_enabled'] : [model_types[id]]
          }
        })

        resolve(models);
      });

    }


    function getSendButtonSelector() {
      return [
        'button[data-testid="submit-button"]',
        'button[aria-label="Submit"]'
      ].join(', ');
    }

    const log = (level, ...args) => {
      try {
        if (typeof console !== 'undefined' && console[level]) {
          console[level]('[Perplexity Intercept]', ...args);
        }
      } catch { }
    };

    // ========== Network Interceptor ==========
    let capturedResponseQueue = [];
    let isCapturing = false;

    async function* iterSSELines(response) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let index;
        while ((index = buffer.indexOf('\n')) !== -1) {
          const rawEvent = buffer.slice(0, index);
          buffer = buffer.slice(index + 1); // ข้าม \n
          yield rawEvent;
        }
      }
    }

    function interceptNetworkRequests() {

      // Intercept Fetch API
      log('info', 'interceptors with model:', modelState.get());
      const originalFetch = window.fetch;
      window.fetch = async function (...args) {
        const url = args[0]?.toString() || '';

        if (url.includes('/rest/sse/perplexity_ask')) {
          let bodyObj = JSON.parse(args[1].body);
          bodyObj.params.model_preference = modelState.get() || "gpt51";
          console.log("[Injected fetch] PATCHED payload!", bodyObj);
          args[1].body = JSON.stringify(bodyObj);
        }

        const response = await originalFetch.apply(this, args);

        // log('info', 'Fetch intercepted:', args);
        // ตรวจสอบว่าเป็น Perplexity API หรือไม่
        // log('info', 'Fetch URL:', url);
        log('info', 'isCapturing:', isCapturing);
        if (isCapturing && url.includes('/rest/sse/perplexity_ask')) {


          log('info', 'Intercepted Perplexity API request:', url);

          // Clone response เพื่ออ่านข้อมูล (เพราะ response body สามารถอ่านได้ครั้งเดียว)
          const clonedResponse = response.clone();
          log('info', 'Cloned response :', clonedResponse);
          log('info', 'Reading response body...');
          try {
            let model_slug = 'unknown';
            let role = 'unknown';
            let id = 'unknown';
            let message_content = '';
            let create_time = 0;
            let input_message = '';
            const cached_tokens = []
            for await (const rawEvent of iterSSELines(clonedResponse)) {
              // rawEvent จะคล้ายๆ:
              // "event: delta\ndata: {...}"
              log('info', 'Raw SSE Event:', rawEvent);
              const lines = rawEvent.split('\n').map(l => l.trim());
              log('info', 'Raw SSE Event Lines:', lines);
              const eventName = lines
                .find(l => l.startsWith('event:'))
                ?.slice('event:'.length)
                ?.trim() || 'message';
              log('info', `Processing event: ${eventName}`);

              const dataLines = lines
                .filter(l => l.startsWith('data:'))
                .map(l => l.slice('data:'.length).trim());
              log('info', `Data lines for event ${eventName}:`, dataLines);

              if (!dataLines.length) continue;

              const dataStr = dataLines.join('\n'); // เผื่อมีหลาย data: ต่อกัน [web:33]
              log('info', `Raw SSE Event Data:`, dataStr);
              if (dataStr === '{}') {
                // console.log('stream done');
                window.postMessage({
                  type: 'V1_CHAT_COMPLETIONS_STREAM',
                  data: `data: [DONE]`
                }, '*');

                window.postMessage({
                  type: 'V1_MESSAGES_STREAM',
                  data: `data: [DONE]`
                }, '*');
                window.postMessage({
                  type: 'V1_CHAT_COMPLETIONS',
                  stream: false,
                  data: {
                    choices: [{
                      finish_reason: 'stop',
                      content: message_content,
                      role: role
                    }],
                    created: create_time,
                    id: id,
                    model: model_slug,
                    request_id: id,
                    usage: {
                      completion_tokens: message_content.length,
                      prompt_tokens: input_message.length,
                      prompt_tokens_details: {
                        cached_tokens: cached_tokens.length,
                      },
                      total_tokens: input_message.length + message_content.length
                    }
                  }
                }, '*');
                window.postMessage({
                  type: 'V1_MESSAGES',
                  stream: false,
                  data: {
                    id: id,
                    type: "message",
                    role: role,
                    model: model_slug,
                    content: [{
                      type: 'text',
                      text: message_content,
                    }],
                    stop_reason: "end_turn",
                    stop_sequence: null,
                    usage: {
                      input_tokens: input_message.length,
                      output_tokens: message_content.length,
                      cache_read_input_tokens: cached_tokens.length,
                    }
                  }
                }, '*');

                log('info', 'Stream done');
                break;
              }

              try {
                if (eventName === 'message') {
                  log('info', `Received message typeof: ${typeof dataStr}`);
                  const payload = JSON.parse(dataStr);
                  log('info', `Parsed event: ${eventName}`, payload);
                  model_slug = payload['display_model'] || model_slug;
                  role = 'assistant' || role;
                  id = payload['uuid'] || id;
                  create_time = new Date().getTime() || create_time;
                  if (payload['blocks'] && Array.isArray(payload['blocks'])) {
                    log('info', `Received blocks:`, payload['blocks']);
                    const ask_text = payload['blocks'].find(item => item['intended_usage'] && item['intended_usage'] === 'ask_text')
                    log('info', `Parsed ask_text:`, ask_text);
                    if (ask_text && Object.keys(ask_text).includes('diff_block')) {
                      if (Object.keys(ask_text['diff_block']).includes('patches')) {
                        let message = ask_text['diff_block']['patches'].find(p => p['path'] && p['path'] === '/answer');
                        let answer = ask_text['diff_block']['patches'].find(p => p['op'] && p['op'] === 'replace');
                        let content = message || {value:answer['value']['answer'] || ''} || '';
                        log('info', `Parsed content for input message:`, content);
                        log('info', `Parsed answer for input message:`, answer);

                        if (content && Object.keys(content).includes('value')) {
                          log('info', `Found content blocks:`, content);

                          // let content = payload['blocks'].find(item => item['path'] && item['path'] === '/answer');
                          const V1_CHAT_COMPLETIONS = {
                            id: id,
                            created: new Date().getTime() || 0,
                            model: model_slug,
                            choices: [{
                              index: 0,
                              delta: {
                                role: role,
                                content: content['value'] || ''
                              }
                            }]
                          }

                          const V1_MESSAGES = {
                            type: "text_delta",
                            text: content['value'] || ''
                          }
                          message_content += V1_CHAT_COMPLETIONS.choices[0].delta.content || '';
                          log('info', `Parsed event: ${eventName}`, `data: ${JSON.stringify(V1_CHAT_COMPLETIONS)}`);
                          window.postMessage({
                            type: 'V1_CHAT_COMPLETIONS_STREAM',
                            data: JSON.stringify(V1_CHAT_COMPLETIONS)
                          }, '*');

                          window.postMessage({
                            type: 'V1_MESSAGES_STREAM',
                            data: JSON.stringify(V1_MESSAGES)
                          }, '*');
                        }
                      }
                    }
                  }
                }
              } catch (e) {
                log('error', 'JSON parse error:', dataStr, e);
              }
            }
          } catch (error) {
            log('error', 'Error reading response:', error);
          }
        }
        return response;

      };


      log('info', 'Network interceptors installed');
    }

    // ========== Provider Class ==========
    window.__API_RELAY_PROVIDERS = window.__API_RELAY_PROVIDERS || {};

    function PerplexityInterceptProvider() {
      this.setupMessageHandler();
      interceptNetworkRequests(this.model);

    }

    PerplexityInterceptProvider.prototype.setupMessageHandler = function () {
      const self = this;
      window.addEventListener('message', async (event) => {
        if (event.source !== window) return;
        if (!event.data.type || !event.data.type.startsWith('RELAY_')) return;

        const { type, id, text, timeout, stream, model } = event.data;

        try {
          switch (type) {
            case 'RELAY_MODEL':
              const { model } = event.data;
              log('info', `Model set to: ${model}`);
              modelState.set(model);
              // interceptNetworkRequests(self.model);
              window.postMessage({ type: 'RELAY_MODEL_SET_DONE', id }, '*');
              break;
            case 'RELAY_INSERT_TEXT':
              await self.insertText(text);
              log('info', `Text inserted: ${text}`);
              window.postMessage({ type: 'RELAY_INSERT_TEXT_DONE', id }, '*');
              break;

            case 'RELAY_CLICK_SEND':
              await self.clickSend();
              log('info', `Send button clicked`);
              window.postMessage({ type: 'RELAY_CLICK_SEND_DONE', id }, '*');
              break;

            case 'RELAY_CAPTURE_RESPONSE_V1_CHAT_COMPLETIONS_STREAM':
              log('info', `Capturing response from network (stream=${!!stream})...`);

              // เริ่มการจับ network requests
              isCapturing = true;
              capturedResponseQueue = [];

              await self.captureResponseFromNetwork({ id, timeout: timeout || 180000, stream: true });
              window.postMessage({ type: 'RELAY_CAPTURE_RESPONSE_V1_CHAT_COMPLETIONS_STREAM', id }, '*');
              isCapturing = false;
              break;
            case 'RELAY_CAPTURE_RESPONSE_V1_MESSAGES_STREAM':
              log('info', `Capturing response from network (stream=${!!stream})...`);

              // เริ่มการจับ network requests
              isCapturing = true;
              capturedResponseQueue = [];

              await self.captureResponseFromNetwork({ id, timeout: timeout || 180000, stream: true });
              window.postMessage({ type: 'RELAY_CAPTURE_RESPONSE_V1_MESSAGES_STREAM', id }, '*');
              isCapturing = false;
              break;

            case 'RELAY_CAPTURE_RESPONSE_V1_CHAT_COMPLETIONS':
              isCapturing = true;
              capturedResponseQueue = [];
              let v1_chat_completions = await self.captureResponseFromNetwork({ id, timeout: timeout || 180000, stream: false });
              log('info', `Response captured from network:`, v1_chat_completions?.text?.length, 'bytes');
              window.postMessage({ type: 'RELAY_CAPTURE_RESPONSE_V1_CHAT_COMPLETIONS', id, result: v1_chat_completions }, '*');
              isCapturing = false;
              break;
            case 'RELAY_CAPTURE_RESPONSE_V1_MESSAGES':
              isCapturing = true;
              capturedResponseQueue = [];
              let v1_messages = await self.captureResponseFromNetwork({ id, timeout: timeout || 180000, stream: false });
              log('info', `Response captured from network:`, v1_messages?.text?.length, 'bytes');
              window.postMessage({ type: 'RELAY_CAPTURE_RESPONSE_V1_MESSAGES', id, result: v1_messages }, '*');
              isCapturing = false;
              break;
            case 'RELAY_CAPTURE_RESPONSE_V1_MODELS':
              isCapturing = true;
              capturedResponseQueue = [];
              window.postMessage({
                type: 'V1_MODELS',
                data: allModelState.get()
              }, '*');
              let v1_models = await self.captureResponseFromNetwork({ id, timeout: timeout || 180000, stream: false });
              log('info', `Response captured from network:`, v1_models?.text?.length, 'bytes');
              window.postMessage({ type: 'RELAY_CAPTURE_RESPONSE_V1_MODELS', id, result: v1_models }, '*');
              isCapturing = false;
              break;
          }
        } catch (error) {
          log('error', `Provider error (${type}):`, error.message);
          window.postMessage({ type: 'RELAY_ERROR', id, error: error.message }, '*');
        }
      });

      console.log('[Perplexity Intercept] Message handler installed (network interception mode)');
    };

    PerplexityInterceptProvider.prototype.insertText = async function (text) {
      const editableDiv = document.querySelector('#ask-input[contenteditable="true"]');
      if (!editableDiv) throw new Error('Perplexity input box not found');

      editableDiv.focus();

      const parts = text.split("\n");

      document.execCommand('selectAll', false, null);
      parts.forEach((line, index) => {
        document.execCommand('insertText', false, line)

        // ถ้าไม่ใช่บรรทัดสุดท้าย ให้ใส่ <br>
        if (index < parts.length - 1) {
          editableDiv.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Enter',
            shiftKey: true,
            bubbles: true
          }));
        }
      });

      await new Promise(r => setTimeout(r, 400));
    };

    PerplexityInterceptProvider.prototype.clickSend = async function () {
      const selectors = getSendButtonSelector().split(',');
      let btn = null;
      for (let sel of selectors) {
        btn = document.querySelector(sel.trim());
        if (btn && btn.offsetParent !== null) break;
      }
      if (!btn) throw new Error('Perplexity send button not found');

      if (btn.disabled) {
        await new Promise(r => setTimeout(r, 1200));
        if (btn.disabled) throw new Error('Send button still disabled');
      }

      btn.focus();
      btn.click();
      await new Promise(r => setTimeout(r, 500));
    };

    PerplexityInterceptProvider.prototype.captureResponseFromNetwork = async function (opts) {
      opts = opts || {};
      const timeout = opts.timeout || 180000;
      const id = opts.id;
      const stream = opts.stream || false;

      return new Promise((resolve, reject) => {
        log('info', `Waiting for network response (timeout: ${timeout}ms)...`);

        let timeoutTimer = setTimeout(() => {
          log('warn', `Capture timeout after ${timeout}ms`);

          if (capturedResponseQueue.length > 0) {
            const fullText = capturedResponseQueue.join('\n');
            resolve({ text: fullText });
          } else {
            reject(new Error('Network capture timeout - no response received'));
          }
        }, timeout);

        let lastChunkTime = Date.now();
        let fullResponse = '';

        // ฟังข้อความที่ส่งมาจาก network interceptor
        const networkListener = (event) => {
          if (event.source !== window) return;
          log('info', 'Network stream:', stream);
          if (stream) {
            if (event.data.type === 'V1_CHAT_COMPLETIONS_STREAM') {
              window.postMessage({
                type: 'RELAY_RESPONSE_V1_CHAT_COMPLETIONS_STREAM',
                id: id,
                data: event.data.data
              }, '*');
            }

            if (event.data.type === 'V1_MESSAGES_STREAM') {
              window.postMessage({
                type: 'RELAY_RESPONSE_V1_MESSAGES_STREAM',
                id: id,
                data: event.data.data
              }, '*');
            }
          } else {
            if (event.data.type === 'V1_CHAT_COMPLETIONS') {
              window.postMessage({
                type: 'RELAY_RESPONSE_V1_CHAT_COMPLETIONS',
                id: id,
                data: event.data.data
              }, '*');
            }

            if (event.data.type === 'V1_MESSAGES') {
              window.postMessage({
                type: 'RELAY_RESPONSE_V1_MESSAGES',
                id: id,
                data: event.data.data
              }, '*');
            }

            if (event.data.type === 'V1_MODELS') {
              window.postMessage({
                type: 'RELAY_RESPONSE_V1_MODELS',
                id: id,
                data: event.data.data
              }, '*');
            }
          }
        };

        window.addEventListener('message', networkListener);

        // ตรวจสอบว่า response เสร็จแล้วหรือยัง (ไม่มี chunk ใหม่มา 2 วินาที)
        const checkInterval = setInterval(() => {
          const timeSinceLastChunk = Date.now() - lastChunkTime;

          if (fullResponse.length > 0 && timeSinceLastChunk > 2000) {
            clearInterval(checkInterval);
            clearTimeout(timeoutTimer);
            window.removeEventListener('message', networkListener);

            log('info', 'Network capture complete:', fullResponse.length, 'bytes');
            resolve({ text: fullResponse });
          }
        }, 500);
      });
    };

    // ========== Initialize ==========
    window.__CHATGPT_PROVIDER__ = new PerplexityInterceptProvider();
    setTimeout(() => {

      getPerplexityModels().then(models => {
        allModelState.set(models.map(m => ({
          id: m.id,
          title: m.title,
          description: m.description,
          enabledTools: m.enabledTools,
          owned_by: 'perplexity',
        })));
      });
    }, 1000);


    console.log('[Perplexity Intercept] Provider initialized (network interception mode - reads from DevTools network)');
  }
})();
