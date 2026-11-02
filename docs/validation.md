# Validação da entrega

## Escopo local

- Node: 18 testes aprovados (`npm test`), incluindo soluções das seis operações por busca em largura, integridade/adjacência das patrulhas, visão bloqueada por parede, colisões no cruzamento, abrigos/cabines, coleta idempotente, saída com arquivos, limite de turnos, restart, persistência validada e progressão.
- Campanha completa jogada no build local pelo navegador integrado, usando botões normais, sem alterar estado do jogo. Resultados: Entrada de serviço 15 turnos; Pátio cego 14; Arquivo morto 18; Via expressa 23; Zona de sombra 22; Última transmissão 18. A busca determinística forneceu os caminhos; isso não é uma avaliação humana de diversão/dificuldade. Final e liberação das seis operações confirmados na UI. Evidência: `local-victory.png`.
- Alarme provocado ao atravessar o corredor da primeira operação e esperar na linha de visão; botão Tentar novamente restaurou início/turno zero. Setas, Espaço, P e Escape exercitados pelo teclado. Manual reabrível, preferências de áudio/movimento e recordes persistiram após reload. Áudio procedural foi ativado por controle; não foi feita análise auditiva humana da qualidade do som.
- Harness local `tests/browser.html` (fora do export) confirmou sete verificações: save corrompido recupera, movimento real, evento blur abre pausa, entrada pausada é ignorada, retomada explícita, movimento após retomada e remoção/reconexão com apenas um listener. A verificação revelou e corrigiu entrada ignorada logo após fechar pausa. O evento blur foi disparado pelo harness; não afirmar troca física de aba como prova dessa pausa automática.
- Viewport móvel 390 × 844: largura útil 375 px com scrollbar, sem overflow horizontal; cinco botões direcionais medem 50 × 44 px. Clique móvel e resize durante a tentativa exercitados. Override temporário restaurado. Evidência `mobile-gameplay.png`.
- Movimento usa Web Animations de 190 ms apenas após uma ação; sem loop contínuo. Opção de movimento reduzido e media query do sistema desativam animações. Regras não dependem da duração da animação.

## Segurança, export e publicação

Sem dependências npm ou remotas: não há árvore de dependências para `npm audit`. Build copia apenas HTML, CSS, favicon e módulos `src/`; testes, docs, credenciais e `.git` não fazem parte do site. CSP restringe scripts/estilos ao próprio site e proíbe conexões, objetos e formulários. Nenhuma chave/API, dado pessoal de demonstração, conta ou backend. Sons e arte são procedurais/originais.

Hospedagem: GitHub Pages de repositório público, disponível no GitHub Free, sem cartão/faturamento/trial contratado. Documentação oficial consultada: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages.

Resultado final do deploy, conferência remota e varredura são registrados após execução antes da entrega.

## Limites

Não testado em telefone físico, Safari, gamepad ou leitor de tela completo. A inspeção de logs inclui erros de extensões do navegador (ex.: analisador de mecanismo de busca) sem origem no código do jogo; não os tratar como falhas corrigidas do produto. Tentativa atual não persiste em reload. Não há cache offline garantido. Recordes são locais e modificáveis pelo usuário. Não alegamos compatibilidade universal, ausência absoluta de vulnerabilidades, vitória em qualquer sequência ou medição de FPS.
