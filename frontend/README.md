
  # Sistema de Votação Mobile

  This is a code bundle for Sistema de Votação Mobile. The original project is available at https://www.figma.com/design/ZQYoBDRPfOk1AnAKA50qeT/Sistema-de-Vota%C3%A7%C3%A3o-Mobile.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Implantação (Kubernetes)

  O build de produção (`npm run build`) gera estáticos para servir atrás de **nginx** (ou CDN) no cluster. A URL base da API (`VITE_*`, conforme implementação) deve corresponder ao **Ingress público** da API no ambiente alvo; ver [`deploy/kubernetes/README.md`](../deploy/kubernetes/README.md) e o [DEVSPEC §5.1](../DEVSPEC.md#51-implantacao-kubernetes).
