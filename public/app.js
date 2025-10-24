let clienteLogado = null; 
let erroTimeout = null; 

const postLogin = async (nome) => {
    const btn = $("btn-login");
    try {
        setLoading(btn, true);
        uiMostrarErro("", "erro-login");

        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome: nome })
        });
        const cliente = await response.json();
        if (!response.ok) throw new Error(cliente.message);
        
        clienteLogado = cliente;
        uiMostrarTelaPrincipal(true);
        uiAtualizarStatus(clienteLogado);
    } catch (err) {
        uiMostrarErro(err.message, "erro-login");
    } finally {
        setLoading(btn, false);
    }
};

const postCompra = async (valor) => {
    if (!clienteLogado) return;
    const btn = $("btn-registrar-compra");
    try {
        setLoading(btn, true);
        uiMostrarErro("", "erro-compra");

        const response = await fetch('/api/compra', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ valor: valor, clienteId: clienteLogado.id }) 
        });
        const resultado = await response.json();
        if (!response.ok) throw new Error(resultado.message);
        
        clienteLogado = resultado;
        uiAtualizarStatus(clienteLogado);
        $("valor-compra").value = "";
    } catch (err) {
        uiMostrarErro(err.message, "erro-compra");
    } finally {
        setLoading(btn, false);
    }
};

const postTroca = async (produto, pontos) => {
    if (!clienteLogado) return;
    const btn = $("btn-resgatar-pontos");
    try {
        setLoading(btn, true);
        uiMostrarErro("", "erro-resgate");

        const response = await fetch('/api/trocar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ produto, pontos, clienteId: clienteLogado.id }) 
        });
        const resultado = await response.json();
        if (!response.ok) throw new Error(resultado.message);
        
        clienteLogado = resultado;
        uiAtualizarStatus(clienteLogado);
        $("produto-resgate").value = "";
        $("pontos-resgate").value = "";
    } catch (err) {
        uiMostrarErro(err.message, "erro-resgate");
    } finally {
        setLoading(btn, false);
    }
};

const postExpirar = async () => {
    if (!clienteLogado) return;
    const btn = $("btn-simular-expiracao");
    const info = $("info-simulacao");

    try {
        const response = await fetch('/api/expirar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clienteId: clienteLogado.id })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message);
        }
        
        const novoEstado = await response.json();
        info.textContent = "Pontos expirados foram processados!";
        clienteLogado = novoEstado;
        uiAtualizarStatus(clienteLogado);

    } catch (err) {
        console.error(err);
        uiMostrarErro(err.message, "erro-compra");
    } finally {
        btn.disabled = false;
        btn.textContent = "Avançar Tempo (Demo)";
    }
};
const $ = (id) => document.getElementById(id);
const uiMostrarErro = (mensagem, elementoId = "erro-login") => {
    clearTimeout(erroTimeout); 
    const el = $(elementoId);
    el.textContent = mensagem;

    if (mensagem) {
        erroTimeout = setTimeout(() => {
            el.textContent = "";
        }, 3000); 
    }
};

const setLoading = (buttonElement, isLoading) => {
    if (isLoading) {
        buttonElement.disabled = true;
        buttonElement.textContent = "Processando...";
    } else {
        buttonElement.disabled = false;
        if (buttonElement.id === 'btn-login') buttonElement.textContent = "Acessar / Cadastrar";
        if (buttonElement.id === 'btn-registrar-compra') buttonElement.textContent = "Registrar Compra";
        if (buttonElement.id === 'btn-resgatar-pontos') buttonElement.textContent = "Resgatar";
    }
};

const uiMostrarTelaPrincipal = (mostrarPrincipal) => {
    $("tela-login").style.display = mostrarPrincipal ? 'none' : 'flex';
    $("tela-principal").style.display = mostrarPrincipal ? 'flex' : 'none';
};

const uiAtualizarStatus = (estado) => {
    $("nome-cliente").textContent = estado.nome;
    $("pontos-cliente").textContent = estado.pontos;
    $("tier-cliente").textContent = estado.tier;
    
    const tierElement = $("tier-cliente");
    tierElement.className = '';
    tierElement.classList.add(estado.tier === 'gold' ? 'tier-gold' : 'tier-silver');
    
    const statusBar = document.querySelector('.status-card');
    statusBar.style.borderTopColor = (estado.tier === 'gold') ? '#f1c40f' : '#bdc3c7';

    const metaElement = $("tier-meta");
    const metaGold = 1000;
    if (estado.tier === 'gold') {
        metaElement.textContent = "Parabéns! Você alcançou o nível máximo.";
    } else {
        const faltam = metaGold - estado.pontos;
        metaElement.textContent = `Faltam ${faltam > 0 ? faltam : 0} pontos para o tier Gold.`;
    }

    const historicoLista = $("historico-pontos");
    historicoLista.innerHTML = '';
    
    if (!estado.historicoPontos || estado.historicoPontos.length === 0) {
        historicoLista.innerHTML = '<li>Nenhuma transação registrada.</li>';
        return;
    }
    
    const historicoReverso = [...estado.historicoPontos].reverse();

    historicoReverso.forEach(entrada => {
        const li = document.createElement('li');
        let texto = '';
        let data = '';

        if (entrada.tipo === 'Ganho') {
            li.className = entrada.expirado ? 'expirado' : 'ganho';
            texto = `+${entrada.pontos} pontos`;
            data = `(Compra de ${new Date(entrada.dataEntrada).toLocaleDateString('pt-BR')})`;
        } else if (entrada.tipo === 'Troca') {
            li.className = 'troca';
            texto = `${entrada.pontos} pontos`;
            data = `(Resgate: ${entrada.descricao})`; 
        }

        li.innerHTML = `
            <span>${texto} ${data}</span>
            <span>${entrada.expirado ? 'Expirado' : ''}</span>
        `;
        historicoLista.appendChild(li);
    });
};

document.addEventListener('DOMContentLoaded', () => {
    $("btn-login").addEventListener('click', () => {
        const nome = $("nome-login").value;
        if (nome.trim()) {
            postLogin(nome);
        } else {
            uiMostrarErro("Por favor, digite um nome.", "erro-login");
        }
    });

    $("btn-logout").addEventListener('click', () => {
        clienteLogado = null;
        $("nome-login").value = "";
        uiMostrarTelaPrincipal(false);
    });

    $("btn-registrar-compra").addEventListener('click', () => {
        const inputValor = $("valor-compra").value;
        postCompra(inputValor);
    });
    
    $("btn-resgatar-pontos").addEventListener('click', () => {
        const produto = $("produto-resgate").value;
        const pontos = $("pontos-resgate").value;
        postTroca(produto, pontos);
    });

    $("btn-simular-expiracao").addEventListener('click', () => {
        const btn = $("btn-simular-expiracao");
        const info = $("info-simulacao");
        
        btn.disabled = true;
        btn.textContent = "Avançando tempo...";
        info.textContent = "Simulação iniciada... Aguarde 10 segundos.";

        setTimeout(() => {
            info.textContent = "Processando expirações...";
            postExpirar(); 
        }, 10000);
    });
    
    uiMostrarTelaPrincipal(false);
});