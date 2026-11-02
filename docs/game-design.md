# Furtivo

Jogo local completo de infiltração por turnos, para quem gosta de antecipação espacial, sem reflexos ou cronômetro real. Referência mecânica: perseguição em grade e stealth determinístico; mapas, regras, nome e arte próprios. Não reproduz assets/personagens de títulos comerciais.

## Contrato fechado

Seis operações autorais de 9 × 7 casas, duas informações por mapa. Mover uma casa cardinal ou esperar avança todas as patrulhas uma etapa. A visão alcança duas casas em linha reta na direção do próximo movimento, bloqueada por paredes. Sombras e cabines de arquivo ocultam da visão, mesmo após coleta, mas não de contato. Cruzar a casa atual ou nova de uma patrulha causa alarme. Recolher ambos os arquivos e pisar na saída vence; detecção ou 100 turnos perde. Paredes e comandos inválidos não gastam turnos. A vitória libera a próxima operação e registra o menor número de turnos localmente.

Não há sorte, servidor, conta, compras, analytics ou placar global. Derrota permite repetir sem penalidade persistente. Campanha final conclui as seis operações; todas as já liberadas podem ser revisitadas. Sem undo: intenção de patrulha é pública. A tentativa atual não sobrevive ao reload.

## Identidade e controles

Central de vigilância brutalista: azul-cobalto, sinal laranja, tinta branca, mapa de quarteirões ortogonal e grade de coordenadas. Nenhuma mesa de cartas, torre 3D, hexágonos ou paddle. Web Components nativos + módulos JavaScript + SVG/CSS, sem framework/engine/dependências. SVG preserva nitidez e animações curtas mostram o deslocamento, nunca escondem as regras. Áudio procedural opcional desligado por padrão; movimento reduzido respeita preferência do sistema e opção local.

Setas/WASD no campo focado; Espaço espera; P pausa/Escape retoma. Botões direcionais funcionam por clique/toque; sem gestos ocultos ou multitouch necessário. Tab/Enter em todos os menus. Foco contido em diálogos. Visão com trama e patrulhas numeradas, além de cor. Status textual descreve posição, arquivos e turnos. Não prometer auditoria completa de leitor de tela.

## Conclusão

Provar solução das seis operações por busca de estados, invariantes e falhas por testes Node. Jogar campanha pela interface real local e pública, incluindo espera, alarme/reinício, pausa/ajuda, resize e persistência. Publicar estático em GitHub Pages gratuito, sem cartão/faturamento, com autor/committer noreply do proprietário. Fechar apenas recursos próprios de teste.
