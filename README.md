# Projeto: Programa de Fidelidade (Programação Funcional no Backend)

Este projeto é uma aplicação web full-stack **multi-usuário** que simula um programa de fidelidade. O **núcleo da lógica de negócio** foi implementado no backend (Node.js) utilizando conceitos de **Programação Funcional (PF)**.

- **Desenvolvido por:** Wiliam Mateus Weber
- **Curso:** Sistemas de Informação

## 1. Visão Geral

A aplicação permite que múltiplos usuários:
- Se cadastrem ou "loguem" no sistema (sem senha, apenas por nome).
- Registrem transações de compra (inserindo um valor) para ganhar pontos.
- **Resgatem pontos** em troca de produtos ou serviços, com validação de saldo.
- Acumulem pontos individualmente.
- Atinjam novos tiers (de Silver para Gold) ao acumular pontos.
- Simulem a passagem do tempo (com um clique) para verificar a expiração de seus pontos.

## 2. Arquitetura (Cliente-Servidor)

O projeto é dividido em duas partes, separando a lógica pura dos efeitos colaterais.

1.  **Backend (Servidor - `server.js`):**
    * Construído com **Node.js** e **Express.js**.
    * Gerencia uma **lista de clientes** na memória do servidor.
    * Expõe uma API REST (`/api/login`, `/api/compra`, `/api/trocar`, `/api/expirar`) para o frontend.
    * **Importante:** Toda a lógica de negócio (cálculos, validações) é importada do arquivo `logicaFidelidade.js`, que contém apenas funções puras.

2.  **Frontend (Cliente - pasta `public/`):**
    * Construído com **HTML, CSS e JavaScript (Vanilla JS)**.
    * Possui uma tela de "Login/Cadastro" e a tela principal da aplicação.
    * Captura cliques, chama a API do backend via `fetch()`, e renderiza a resposta na tela.
    * Envia um `clienteId` em todas as requisições para que o backend saiba qual cliente atualizar.
    * Fornece feedback visual ao usuário (mensagens de loading nos botões e erros que desaparecem).

## 3. Como Executar

O projeto agora requer um servidor Node.js para rodar.

1.  **Pré-requisito:** Ter o **Node.js** instalado.
2.  **Baixe/Clone o projeto** e abra um terminal (Prompt de Comando `cmd`) na pasta raiz (`projeto-fidelidade`).
3.  **Instale as dependências:**
    ```bash
    npm install
    ```
4.  **Inicie o servidor:**
    ```bash
    node server.js
    ```
5.  **Acesse a aplicação:**
    * O terminal mostrará: `Servidor rodando em http://localhost:3000`
    * Abra este endereço (`http://localhost:3000`) em qualquer navegador.

## 4. Aplicação dos Conceitos de Programação Funcional

O objetivo foi isolar toda a lógica funcional no backend, mantendo-a pura e separada dos "efeitos colaterais" (como gerenciar o estado e as rotas HTTP).

Toda a lógica de PF está no arquivo `logicaFidelidade.js`.

### A. Funções Puras

A lógica de negócio é contida em funções puras, que dependem apenas de seus argumentos e não produzem efeitos colaterais.

**Exemplos (`logicaFidelidade.js`):**
* `validarEntradaCompra(input)`
* `validarEntradaTroca(produto, pontos)`
* `calcularPontos(valorCompra, tier)`
* `atualizarTier(saldoPontos, tierAtual)`

### B. Imutabilidade

O estado de *cada cliente* é imutável. As funções em `logicaFidelidade.js` recebem um `estadoAtual` e retornam um `novoEstado`.

No `server.js`, a **lista inteira de clientes** também é tratada de forma imutável ao ser atualizada, graças ao uso da HOF `map`.

### C. Funções de Ordem Superior (HOFs)

Usamos `map` e `reduce` para processar listas de dados de forma funcional.

1.  **`reduce` (em `calcularSaldoTotal`)**:
    Usamos `reduce` para "reduzir" o array `historicoPontos` de um cliente a um único valor: seu saldo total. A função é inteligente e soma pontos positivos (ganhos) e subtrai pontos negativos (trocas).

2.  **`map` (em `verificarExpiracao`)**:
    Usamos `map` para transformar o `historicoAtual` de um cliente em um `novoHistorico`, garantindo a imutabilidade, onde cada item tem seu status de expiração verificado.

3.  **`map` (em `server.js`)**:
    Este é o uso mais importante. Quando um cliente (`clienteId: "12345"`) é atualizado, não modificamos a lista: criamos uma **nova lista** usando `map`.

    ```javascript
    // Exemplo de como o servidor atualiza a lista de forma imutável:
    listaDeClientes = listaDeClientes.map(cliente => {
        if (cliente.id === clienteId) {
            return novoEstadoCliente; // Troca o cliente antigo pelo novo
        }
        return cliente; // Mantém os outros clientes como estão
    });
    ```

## 5. Invariantes (Regras de Ouro)

A lógica funcional também garante que as regras do sistema nunca sejam quebradas:

* **Pontos nunca negativos:** A função `calcularSaldoTotal` usa `Math.max(0, totalBruto)` para garantir que, mesmo que o histórico expire, o saldo nunca fique negativo.
* **Expiração Respeita Validade:** A HOF `map` em `verificarExpiracao` compara as datas para garantir que apenas pontos com mais de 365 dias sejam marcados como expirados.