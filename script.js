
const CHAVE_ARMAZENAMENTO = "hidroalerta_ocorrencias";

const formulario = document.querySelector("#form-ocorrencia");
const campoLocal = document.querySelector("#local");
const campoData = document.querySelector("#data");
const campoHorario = document.querySelector("#horario");
const campoSituacao = document.querySelector("#situacao");
const campoDescricao = document.querySelector("#descricao");
const campoBusca = document.querySelector("#busca");
const campoFiltro = document.querySelector("#filtro-situacao");

const listaOcorrencias = document.querySelector("#lista-ocorrencias");
const totalOcorrencias = document.querySelector("#total-ocorrencias");
const totalAcompanhamento = document.querySelector("#total-acompanhamento");
const mensagemFormulario = document.querySelector("#mensagem-formulario");

let ocorrencias = carregarOcorrencias();

// Define a data atual como valor inicial do formulário.
const hoje = new Date();
const dataLocal = [
    hoje.getFullYear(),
    String(hoje.getMonth() + 1).padStart(2, "0"),
    String(hoje.getDate()).padStart(2, "0")
].join("-");

campoData.value = dataLocal;
campoData.max = dataLocal;

// Lê os registros salvos neste navegador.
function carregarOcorrencias() {
    try {
        const dados = localStorage.getItem(CHAVE_ARMAZENAMENTO);
        const registros = dados ? JSON.parse(dados) : [];

        return Array.isArray(registros) ? registros : [];
    } catch (erro) {
        console.error("Não foi possível ler os registros:", erro);
        return [];
    }
}

// Salva os registros no armazenamento local.
function salvarOcorrencias() {
    try {
        localStorage.setItem(
            CHAVE_ARMAZENAMENTO,
            JSON.stringify(ocorrencias)
        );

        return true;
    } catch (erro) {
        console.error("Não foi possível salvar os registros:", erro);
        mostrarMensagem(
            "Não foi possível salvar. Verifique o armazenamento do navegador.",
            "erro"
        );

        return false;
    }
}

// Exibe mensagens para quem utiliza o formulário.
function mostrarMensagem(texto, tipo) {
    mensagemFormulario.textContent = texto;
    mensagemFormulario.className = `mensagem ${tipo}`;
}

// Formata uma data sem alterar o dia por causa do fuso horário.
function formatarData(data) {
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
}

// Cria elementos de texto de forma segura.
function criarElemento(tag, classe, texto) {
    const elemento = document.createElement(tag);

    if (classe) {
        elemento.className = classe;
    }

    if (texto !== undefined) {
        elemento.textContent = texto;
    }

    return elemento;
}

// Atualiza os números apresentados na página.
function atualizarResumo() {
    totalOcorrencias.textContent = ocorrencias.length;

    const emAcompanhamento = ocorrencias.filter(
        ocorrencia => ocorrencia.situacao === "Em acompanhamento"
    ).length;

    totalAcompanhamento.textContent = emAcompanhamento;
}

// Cria o cartão de uma ocorrência.
function criarCartao(ocorrencia) {
    const cartao = criarElemento("article", "ocorrencia");
    const topo = criarElemento("div", "ocorrencia-topo");

    const titulo = criarElemento("h3", "", ocorrencia.local);

    const classesSituacao = {
        "Registrada": "situacao-registrada",
        "Em acompanhamento": "situacao-acompanhamento",
        "Normalizada": "situacao-normalizada"
    };

    const etiqueta = criarElemento(
        "span",
        `situacao ${classesSituacao[ocorrencia.situacao] || "situacao-registrada"}`,
        ocorrencia.situacao
    );

    topo.append(titulo, etiqueta);

    const descricao = criarElemento(
        "p",
        "ocorrencia-descricao",
        ocorrencia.descricao
    );

    const detalhes = criarElemento("div", "ocorrencia-detalhes");

    const data = criarElemento(
        "span",
        "",
        `Data: ${formatarData(ocorrencia.data)}`
    );

    const horario = criarElemento(
        "span",
        "",
        `Horário: ${ocorrencia.horario}`
    );

    detalhes.append(data, horario);
    cartao.append(topo, descricao, detalhes);

    const botaoExcluir = criarElemento(
        "button",
        "botao-excluir",
        "Excluir registro"
    );

    botaoExcluir.type = "button";
    botaoExcluir.setAttribute(
        "aria-label",
        `Excluir ocorrência em ${ocorrencia.local}`
    );

    botaoExcluir.addEventListener("click", () => {
        excluirOcorrencia(ocorrencia.id);
    });

    cartao.append(botaoExcluir);

    return cartao;
}

// Exibe a lista de acordo com a pesquisa e o filtro.
function renderizarOcorrencias() {
    const termo = campoBusca.value.trim().toLocaleLowerCase("pt-BR");
    const situacaoSelecionada = campoFiltro.value;

    const filtradas = ocorrencias
        .filter(ocorrencia => {
            const texto = `${ocorrencia.local} ${ocorrencia.descricao}`
                .toLocaleLowerCase("pt-BR");

            const correspondeBusca = texto.includes(termo);

            const correspondeSituacao =
                !situacaoSelecionada ||
                ocorrencia.situacao === situacaoSelecionada;

            return correspondeBusca && correspondeSituacao;
        })
        .sort((a, b) => {
            const dataA = `${a.data}T${a.horario}`;
            const dataB = `${b.data}T${b.horario}`;

            return dataB.localeCompare(dataA);
        });

    listaOcorrencias.replaceChildren();

    if (filtradas.length === 0) {
        const vazio = criarElemento("div", "estado-vazio");

        const icone = criarElemento("span", "", "⌕");
        icone.setAttribute("aria-hidden", "true");

        const titulo = criarElemento(
            "h3",
            "",
            ocorrencias.length === 0
                ? "Nenhuma ocorrência por enquanto"
                : "Nenhum resultado encontrado"
        );

        const descricao = criarElemento(
            "p",
            "",
            ocorrencias.length === 0
                ? "Os registros adicionados aparecerão aqui."
                : "Tente mudar a pesquisa ou selecionar outra situação."
        );

        vazio.append(icone, titulo, descricao);
        listaOcorrencias.append(vazio);
    } else {
        const fragmento = document.createDocumentFragment();

        filtradas.forEach(ocorrencia => {
            fragmento.append(criarCartao(ocorrencia));
        });

        listaOcorrencias.append(fragmento);
    }

    atualizarResumo();
}

// Registra uma nova ocorrência.
formulario.addEventListener("submit", evento => {
    evento.preventDefault();

    const local = campoLocal.value.trim();
    const data = campoData.value;
    const horario = campoHorario.value;
    const situacao = campoSituacao.value;
    const descricao = campoDescricao.value.trim();

    if (!local || !data || !horario || !situacao || !descricao) {
        mostrarMensagem(
            "Preencha todos os campos obrigatórios.",
            "erro"
        );
        return;
    }

    if (data > dataLocal) {
        mostrarMensagem(
            "A data da ocorrência não pode ser futura.",
            "erro"
        );
        return;
    }

    const novaOcorrencia = {
        id: crypto.randomUUID(),
        local,
        data,
        horario,
        situacao,
        descricao
    };

    ocorrencias.push(novaOcorrencia);

    if (!salvarOcorrencias()) {
        ocorrencias.pop();
        return;
    }

    formulario.reset();
    campoData.value = dataLocal;

    mostrarMensagem("Ocorrência registrada com sucesso!", "sucesso");

    // Limpa filtros para mostrar o registro recém-adicionado.
    campoBusca.value = "";
    campoFiltro.value = "";

    renderizarOcorrencias();

    document.querySelector("#ocorrencias").scrollIntoView({
        behavior: "smooth"
    });
});

// Exclui um registro após confirmação.
function excluirOcorrencia(id) {
    const confirmar = window.confirm(
        "Deseja realmente excluir esta ocorrência?"
    );

    if (!confirmar) {
        return;
    }

    const registrosAnteriores = ocorrencias;

    ocorrencias = ocorrencias.filter(
        ocorrencia => ocorrencia.id !== id
    );

    if (!salvarOcorrencias()) {
        ocorrencias = registrosAnteriores;
        return;
    }

    renderizarOcorrencias();
    mostrarMensagem("Ocorrência excluída.", "sucesso");
}

// Atualiza a lista enquanto o usuário pesquisa ou filtra.
campoBusca.addEventListener("input", renderizarOcorrencias);
campoFiltro.addEventListener("change", renderizarOcorrencias);

// Apresenta os registros já salvos ao abrir o site.
renderizarOcorrencias();
