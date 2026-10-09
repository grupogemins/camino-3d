# 08. Riscos e mitigação

| # | Risco | Tipo | Impacto | Mitigação |
|---|---|---|---|---|
| 1 | Comissão das lojas (15–30%) se a assinatura for vendida dentro do app iOS/Android | Financeiro | Margem do Premium de EUR 10 cai para cerca de EUR 7 | Vender o Passe na web (PWA) primeiro. Nas lojas, avaliar a regra de "reader/external link" de cada país ou aceitar IAP com preço ajustado |
| 2 | Licença do Open-Meteo gratuita é não comercial | Legal | Uso indevido em produção paga | Plano comercial antes de cobrar; mock até lá |
| 3 | Dados de rota, albergues e preços desatualizados | Segurança / reputação | Peregrino chega a albergue fechado | Fonte e data em todo dado; canal "informar erro" (fase 2); nunca dizer que a rota é "segura" |
| 4 | Localização de peregrinos expõe pessoas (especialmente mulheres que caminham sozinhas) | Segurança / LGPD-RGPD | Perseguição, assédio | Desligada por padrão; granularidade de cidade; posição precisa expira em 60 min; modo invisível; bloqueio imediato; RLS no banco |
| 5 | RGPD: dados de localização e saúde (contatos de emergência) | Legal | Multas, perda de confiança | Base legal por consentimento explícito; exportar e apagar conta; minimização; DPA com Supabase/Stripe; servidores na UE |
| 6 | Reconhecimento de voz do navegador envia áudio ao fornecedor (Google/Apple) | Privacidade | Dado de voz fora do controle | Consentimento específico e aviso claro; frases offline como alternativa |
| 7 | SOS falha sem sinal ou com bateria baixa | Segurança | Pessoa sem ajuda | O app sempre mostra o 112 para discagem direta; SOS com confirmação e contagem para evitar falso alarme; nunca substitui serviços de emergência |
| 8 | Patrocínio influenciar recomendações | Ética / legal (publicidade) | Perda de confiança, infração de normas de publicidade | Selo "Patrocinado"; boost limitado (no máx. 0,5 × 0,3 do score); nunca em segurança, rota ou SOS |
| 9 | Termos de afiliados (Booking, GetYourGuide etc.) proíbem certos usos | Legal | Corte da comissão | Ler os termos antes de cada programa; sem scraping; links rastreados só com aviso |
| 10 | 3D pesado em celulares baratos | Técnico | Lentidão, bateria | Carregamento sob demanda; fallback 2D; pausa com movimento reduzido; meta de < 150 KB de JS inicial por tela |
| 11 | Moderação da comunidade não escala | Operacional | Conteúdo abusivo | Filtro automático + denúncias + fila no admin; limites de mensagens no gratuito |
| 12 | Créditos de mapa (OpenStreetMap/OpenFreeMap) omitidos | Legal | Violação da ODbL | Atribuição visível no mapa (já ativa) |
| 13 | Uso do termo "Credencial" ou "Compostela" | Legal / marca | Confusão com documento oficial da Catedral | Carimbos descritos como simbólicos, com aviso explícito |
| 14 | Dependência de chaves de terceiros e custos variáveis | Financeiro | Conta alta com pico de uso | Cache no servidor, limites por IP, alertas de orçamento por provedor |
