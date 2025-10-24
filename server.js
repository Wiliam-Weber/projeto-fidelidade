const express = require('express');
const path = require('path');

const {
    REGRAS,
    validarEntradaCompra,
    validarEntradaTroca, 
    processarCompra,
    processarTroca,
    processarExpiracao
} = require('./logicaFidelidade.js');

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.json());

let listaDeClientes = [];

app.post('/api/login', (req, res) => {

    const { nome } = req.body;
    if (!nome) {
        return res.status(400).json({ message: "Nome é obrigatório." });
    }

    let cliente = listaDeClientes.find(c => c.nome.toLowerCase() === nome.toLowerCase());

    if (cliente) {
        console.log(`Cliente ${nome} logou.`);
        res.json(cliente);
    } else {
        const novoCliente = {
            id: Date.now().toString(),
            nome: nome,
            tier: REGRAS.TIERS.SILVER.nome,
            pontos: 0,
            historicoPontos: [],
        };
        listaDeClientes.push(novoCliente);
        console.log(`Cliente ${nome} cadastrado com ID ${novoCliente.id}.`);
        res.status(201).json(novoCliente);
    }
});


app.post('/api/compra', (req, res) => {

    const { valor, clienteId } = req.body;
    
    const validacao = validarEntradaCompra(valor);
    if (!validacao.success) {
        return res.status(400).json({ message: validacao.message });
    }

    const estadoAtual = listaDeClientes.find(c => c.id === clienteId);
    if (!estadoAtual) {
        return res.status(404).json({ message: "Cliente não encontrado." });
    }

    const novoEstadoCliente = processarCompra(
        estadoAtual,
        validacao.value,
        new Date()
    );
    
    listaDeClientes = listaDeClientes.map(cliente => {
        return (cliente.id === clienteId) ? novoEstadoCliente : cliente;
    });
    
    res.json(novoEstadoCliente);
});


app.post('/api/trocar', (req, res) => {

    const { produto, pontos, clienteId } = req.body;

    const validacao = validarEntradaTroca(produto, pontos);
    if (!validacao.success) {
        return res.status(400).json({ message: validacao.message });
    }

    const estadoAtual = listaDeClientes.find(c => c.id === clienteId);
    if (!estadoAtual) {
        return res.status(404).json({ message: "Cliente não encontrado." });
    }

    const { novoEstado, erro } = processarTroca(
        estadoAtual,
        validacao.produto,
        validacao.pontos
    );

    if (erro) {
        return res.status(400).json({ message: erro });
    }

    listaDeClientes = listaDeClientes.map(cliente => {
        return (cliente.id === clienteId) ? novoEstado : cliente;
    });
    
    res.json(novoEstado);
});

app.post('/api/expirar', (req, res) => {
    const { clienteId } = req.body;

    const estadoAtual = listaDeClientes.find(c => c.id === clienteId);
    if (!estadoAtual) {
        return res.status(404).json({ message: "Cliente não encontrado." });
    }

    const dataFutura = new Date();
    dataFutura.setDate(dataFutura.getDate() + REGRAS.VALIDADE_PONTOS_DIAS + 1);

    const novoEstadoCliente = processarExpiracao(estadoAtual, dataFutura);
    
    listaDeClientes = listaDeClientes.map(cliente => {
        return (cliente.id === clienteId) ? novoEstadoCliente : cliente;
    });

    res.json(novoEstadoCliente);
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});