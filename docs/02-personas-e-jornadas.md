# 2. Personas e jornadas principais

As personas são fictícias e servem para orientar decisões de design. Os dados de cada uma estão também em `src/data/demo/personas.ts` para uso em testes e demonstrações.

## Personas

| # | Persona | Quem é | Objetivo principal | Medo | Funcionalidades-chave |
|---|---|---|---|---|---|
| 1 | **Ana, a iniciante** | 34 anos, São Paulo, primeira peregrinação, 12 dias de férias | Chegar a Santiago sem se perder e com cama garantida | Lesão, ficar sem hospedagem, se perder | Onboarding guiado, etapas recomendadas, modo "Mais fácil", Central de Segurança, check-in |
| 2 | **Klaus, o experiente** | 58 anos, Munique, já fez o Francês duas vezes | Fugir das multidões e descobrir variantes | Trechos lotados e asfalto | Comparação de rotas, modo "Menos movimentada", Variante Espiritual, filtros avançados |
| 3 | **Lucía, a econômica** | 23 anos, Buenos Aires, estudante | Fazer o Caminho com até EUR 35/dia | Estourar o orçamento | Modo "Mais econômica", albergues municipais, menu do peregrino, controle de orçamento por etapa |
| 4 | **Tom, o social** | 29 anos, Dublin, viaja sozinho | Conhecer gente e caminhar em grupo | Solidão, mas também exposição excessiva | Comunidade, grupos por etapa, presença com granularidade, encontros em local público |
| 5 | **Marta, com mobilidade reduzida** | 63 anos, Porto, prótese no joelho | Fazer trechos adaptados com apoio de transporte | Subidas íngremes, escadas, falta de transporte | Modo "Mais acessível", dados de inclinação e piso, transporte de apoio, estabelecimentos acessíveis |
| 6 | **Kenji, o internacional** | 41 anos, Osaka, não fala espanhol nem português | Se comunicar e entender a cultura local | Emergência sem conseguir se comunicar | Tradutor por voz, frases offline (alergias, saúde), moeda/unidades, etiqueta cultural |

## Jornadas principais

### J1. Do sonho ao plano (Ana)
1. Abre o app → Splash → "Começar".
2. Cria conta por e-mail → Onboarding (idioma, país, data, Porto → Santiago, 12 dias, 20 km/dia, condicionamento iniciante, orçamento EUR 50, albergue/pousada, interesses: igrejas e gastronomia, caminha sozinha mas aberta a conhecer pessoas, consentimentos).
3. Planejador sugere a **Rota Central** em 12 etapas no modo "Mais fácil".
4. Compara com Costa e Espiritual → escolhe Central.
5. Vê etapa 1 → reserva/consulta hospedagem no fornecedor autorizado.
6. Baixa a rota para uso offline.

**Momento de valor (ativação):** ver as 12 etapas com distância, elevação e onde dormir em menos de 3 minutos.

### J2. Um dia no Caminho (Ana, Tom)
1. Manhã: tela inicial mostra etapa do dia, clima da etapa ("leve capa de chuva a partir das 14h"), nascer do sol.
2. Inicia navegação → personagem caminha → próximo ponto de água a 2,3 km.
3. Sai da rota → alerta "Você está a 180 m do traçado".
4. Para no café com "menu do peregrino" e enche a garrafa.
5. Tom ativa presença "Cidade" e entra no grupo "Etapa Pontevedra → Caldas".
6. Chegada: carimbo digital, nota no diário, personagem comemora.

### J3. Imprevisto (Marta, Kenji)
1. Dor no joelho → Central de Segurança → "Transporte de apoio" mostra táxi/ônibus para a próxima vila.
2. Kenji precisa de farmácia → Tradutor → frase offline "Sou alérgico a penicilina" reproduzida em espanhol.
3. Emergência → botão SOS → confirmação → ligação para 112 + compartilhamento temporário de posição com contatos.

### J4. Conversão (Lucía)
1. Usa o plano gratuito durante o planejamento.
2. Tenta baixar mapas offline → tela Premium explica o benefício.
3. Inicia o Passe do Caminho (EUR 10) → pagamento (Stripe) → recursos liberados.

### J5. Parceiro e moderação (admin)
1. Estabelecimento patrocinador aparece com selo "Patrocinado".
2. Moderador vê denúncia na fila → aplica ação (aviso, suspensão).
3. Equipe acompanha o funil de conversão (dados de demonstração no MVP).
