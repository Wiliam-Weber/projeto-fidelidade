const fetchEstado = async () => {
    try {
        const response = await fetch('/api/estado');
        if (!response.ok) throw new Error('Erro ao buscar estado.');
        const estado = await response.json();
        uiAtualizarStatus(estado);
    } catch (err) {
        console.error(err);
        uiMostrarErro("Erro de conexão com o servidor.");
    }
};

/**
 * @param {string} valor 
 */
const postCompra = async (valor) => {

    try {
        const response = await fetch('/api/compra', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ valor: valor })
        });
        
        const resultado = await response.json();

        if (!response.ok) {

            throw new Error(resultado.message);
        }
        
        uiAtualizarStatus(resultado);
        uiMostrarErro("");
        $("valor-compra").value = "";

    } catch (err) {
        uiMostrarErro(err.message);
    }
};


const postExpirar = async () => {

    try {
        const response = await fetch('/api/expirar', { method: 'POST' });
        if (!response.ok) throw new Error('Erro ao expirar pontos.');
        
        const novoEstado = await response.json();
        
        const dataFutura = new Date();
        dataFutura.setDate(dataFutura.getDate() + 366); 
        alert(`Simulando a data de hoje como: ${dataFutura.toLocaleDateString('pt-BR')}\n\nQualquer ponto ganho há 365 dias ou mais foi expirado.`);

        uiAtualizarStatus(novoEstado);

    } catch (err) {
        console.error(err);
        uiMostrarErro(err.message);
    }
};




const $ = (id) => document.getElementById(id);

const uiMostrarErro = (mensagem) => {
    $("erro-compra").textContent = mensagem;
};

const uiAtualizarStatus = (estado) => {
    // Código gerado por IA
    
    $("nome-cliente").textContent = estado.nome;
    $("pontos-cliente").textContent = estado.pontos;
    $("tier-cliente").textContent = estado.tier;
    
    const tierElement = $("tier-cliente");
    tierElement.className = '';
    tierElement.classList.add(estado.tier === 'gold' ? 'tier-gold' : 'tier-silver');
    
    const statusBar = document.querySelector('.status-card');
    statusBar.style.borderTopColor = (estado.tier === 'gold') ? '#f1c40f' : '#bdc3c7';

    const metaElement = $("tier-meta");
    if (estado.tier === 'gold') {
        metaElement.textContent = "Parabéns! Você alcançou o nível máximo.";
    } else {
        const metaGold = 1000; 
        const faltam = metaGold - estado.pontos;
        metaElement.textContent = `Faltam ${faltam > 0 ? faltam : 0} pontos para o tier Gold.`;
    }

    const historicoLista = $("historico-pontos");
    historicoLista.innerHTML = '';
    
    if (!estado.historicoPontos || estado.historicoPontos.length === 0) {
        historicoLista.innerHTML = '<li>Nenhuma transação registrada.</li>';
        return;
    }

    estado.historicoPontos.forEach(entrada => {
        const li = document.createElement('li');
        if (entrada.expirado) {
            li.className = 'expirado';
        }
        
        const dataEntrada = new Date(entrada.dataEntrada).toLocaleDateString('pt-BR');
        const dataExpiracao = new Date(entrada.dataExpiracao).toLocaleDateString('pt-BR');

        li.innerHTML = `
            <span>+${entrada.pontos} pontos (Expira em: ${dataExpiracao})</span>
            <span>Ganho em: ${dataEntrada}</span>
        `;
        historicoLista.appendChild(li);
    });
};


document.addEventListener('DOMContentLoaded', () => {
    fetchEstado();

    $("btn-registrar-compra").addEventListener('click', () => {
        const inputValor = $("valor-compra").value;
        postCompra(inputValor);
    });
    
    $("btn-expirar-pontos").addEventListener('click', () => {
        postExpirar();
    });
});