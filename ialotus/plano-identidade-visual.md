# Plano de alterações da identidade visual IA.Lotus

## Base extraída dos arquivos

- Paleta principal: `#0C121F`, `#0B111E`, `#131D30`, `#FAF6F3`, `#BDCCD4`.
- Tipografia indicada no PDF e no arquivo `Logo.ai`: Termina Regular e Termina Demi.
- Fallback atual: Inter, enquanto a fonte licenciada não estiver no projeto em formato web (`.woff` ou `.woff2`).
- Direção visual: fundo escuro institucional, marca clara, contraste alto, poucos acentos e composição mais limpa.

## Fase 1 - Fundação visual

- Centralizar tokens de cor, tipografia, raios, bordas e sombras no `:root` do CSS.
- Remover acentos antigos em verde/azul que não aparecem na nova identidade.
- Atualizar favicon, logo inline e eventuais assets exportados do PDF para SVG/WEBP otimizados.
- Incluir arquivos de fonte Termina, caso a licença permita uso web, com `@font-face`.

## Fase 2 - Limpeza e consistência da home

- Manter na `index.html` apenas seções publicadas: navbar, hero, soluções e footer.
- Remover HTML comentado, estilos sem uso e scripts que dependiam de elementos removidos.
- Validar responsividade do hero, cards e footer em mobile, tablet e desktop.
- Conferir contraste WCAG para texto sobre vídeo e fundos escuros.

## Fase 3 - Componentização visual

- Criar padrões reutilizáveis para logo, grid de soluções, cards, containers e headings.
- Padronizar iconografia com stroke, peso e cor alinhados à marca.
- Definir estados de hover/focus coerentes com a nova paleta.
- Documentar variáveis e regras de uso no README ou guia interno.

## Fase 4 - Expansão da aplicação

- Reaplicar tokens nos demais arquivos e páginas quando voltarem a existir: sobre, infraestrutura, contato e formulários.
- Revisar textos, CTAs e hierarquia visual para evitar mistura entre identidade antiga e nova.
- Gerar screenshots de regressão visual após cada bloco de página.
- Fazer revisão final em navegadores modernos e em viewport mobile real.

## Checklist de aceite

- Nenhum bloco HTML comentado usado como depósito de código antigo.
- Nenhum erro de JavaScript no carregamento da página.
- CSS sem seletores principais de seções inexistentes.
- Paleta do PDF aplicada como base visual.
- Tipografia pronta para Termina quando o arquivo webfont for disponibilizado.
- Arquivos originais da marca salvos em `assets/brand/`.
