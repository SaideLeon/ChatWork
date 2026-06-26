# ChatWork — Editor de Documentos Word com IA

Editor colaborativo de documentos Word (`.docx`) usando Next.js 14, com pré-visualização em tempo real e edição por linguagem natural via IA (Claude).

## ✨ Funcionalidades

- **Upload de .docx** — descompacta o ficheiro e extrai todas as partes XML
- **Sidebar de partes** — lista todas as secções editáveis (documento, cabeçalhos, rodapés, estilos, numeração)
- **Chat com IA** — descreve em português o que queres alterar; a IA edita o XML directamente
- **Pré-visualização em tempo real** — vê o resultado imediatamente após cada edição
- **Modo XML** — inspecta o XML bruto de qualquer secção
- **Exportação** — repacota o `.docx` com todas as edições e faz download

## 🚀 Instalação

```bash
# 1. Clonar o repositório
git clone https://github.com/SaideLeon/ChatWork.git
cd ChatWork

# 2. Instalar dependências
npm install

# 3. Configurar variável de ambiente
cp .env.example .env.local
# Editar .env.local e adicionar a tua chave da Anthropic API

# 4. Arrancar em desenvolvimento
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) no browser.

## 🔧 Variáveis de Ambiente

Cria um ficheiro `.env.local` na raiz do projecto:

```env
# Obtém a tua chave em https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-...
```

> **Nota:** A chave é usada nas API routes do servidor — nunca é exposta ao cliente.

## 🏗️ Estrutura do Projecto

```
src/
├── app/
│   ├── page.tsx                    # Landing / upload
│   ├── editor/[sessionId]/page.tsx # Editor principal
│   └── api/
│       ├── upload/route.ts         # POST — recebe .docx, cria sessão
│       ├── parse/[sessionId]/      # GET — retorna partes da sessão
│       ├── edit/route.ts           # POST — edita parte via IA
│       └── export/route.ts         # POST — recompacta e devolve .docx
├── components/editor/
│   ├── Topbar.tsx                  # Barra superior
│   ├── Sidebar.tsx                 # Lista de partes
│   ├── PreviewPanel.tsx            # Pré-visualização / XML viewer
│   └── ChatPanel.tsx               # Interface de chat com IA
├── lib/
│   ├── docx.ts                     # Descompactar, compactar, XML→HTML
│   └── sessions.ts                 # Store de sessões em memória
└── types/index.ts                  # Tipos TypeScript
```

## 🛠️ Stack

| Tecnologia | Uso |
|-----------|-----|
| Next.js 14 (App Router) | Framework full-stack |
| TypeScript | Tipagem |
| Tailwind CSS | Estilos |
| JSZip | Descompactar/recompactar .docx |
| xml2js | Parsing XML |
| Claude API (claude-sonnet-4-6) | Edição inteligente de XML |

## 📝 Como usar

1. Abre a aplicação e faz upload do teu `.docx`
2. Na barra lateral, selecciona a secção que queres editar (ex: "Documento Principal")
3. No chat à direita, escreve a instrução em português (ex: *"Muda o título para 'Relatório Final 2025'"*)
4. A IA edita o XML e a pré-visualização actualiza-se automaticamente
5. Repete para outras secções
6. Clica **Exportar .docx** para descarregar o ficheiro final

## ⚠️ Notas

- As sessões expiram após **2 horas** — guarda o ficheiro antes disso
- Para produção, substituir o store em memória (`sessions.ts`) por Redis ou base de dados
- O servidor Next.js precisa de acesso à API da Anthropic
