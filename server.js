const express = require('express');
const path = require('path');


const {
    REGRAS,
    validarEntradaCompra,
    processarCompra,
    processarExpiracao
} = require('./logicaFidelidade.js');

const app = express();
const port = 3000;



app.use(express.json());


let estadoCliente = {
    nome: "Wiliam",
    tier: REGRAS.TIERS.SILVER.nome,
    pontos: 0,
    historicoPontos: [],
};


app.get('/api/estado', (req, res) => {

    res.json(estadoCliente);
});


app.post('/api/compra', (req, res) => {

    const { valor } = req.body; 
    

    const validacao = validarEntradaCompra(valor);
    
    if (!validacao.success) {

        return res.status(400).json({ message: validacao.message });
    }
    
    const novoEstado = processarCompra(
        estadoCliente,
        validacao.value,
        new Date() 
    );
    

    estadoCliente = novoEstado;
    

    res.json(estadoCliente);
});


app.post('/api/expirar', (req, res) => {

    const dataFutura = new Date();
    dataFutura.setDate(dataFutura.getDate() + REGRAS.VALIDADE_PONTOS_DIAS + 1);


    const novoEstado = processarExpiracao(estadoCliente, dataFutura);
    

    estadoCliente = novoEstado;
    

    res.json(estadoCliente);
});



app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
    console.log('Foco: Programação Funcional (lógica pura) no backend.');
});