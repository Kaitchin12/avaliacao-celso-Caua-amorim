// --------------------------------------------------
// Espera o DOM carregar completamente antes de executar o código
// --------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    
    // --------------------------------------------------
    // Captura elementos do DOM que vamos manipular
    // --------------------------------------------------
    const formAdicionarTarefa = document.getElementById('form-adicionar-tarefa'); // formulário para adicionar tarefas
    const listaTarefas = document.getElementById('lista-tarefas'); // ul/ol onde as tarefas serão listadas
    const selectOrdenar = document.getElementById('ordenar'); // select para escolher a ordem das tarefas

    // URL base da API de tarefas
    const API_BASE_URL = 'http://localhost:2009/tasks';

    // --------------------------------------------------
    // Função que gera o HTML de uma tarefa
    // --------------------------------------------------
    const renderTaskHtml = (task) => {
        // Verifica se a tarefa está concluída
        const isDone = task.status === 'concluida';
        // Define classe CSS da tarefa (para estilo visual)
        const statusClass = isDone ? 'concluida' : 'pendente';

        // Formata a data da tarefa para padrão brasileiro
        const dateDisplay = new Date(task.data_prevista).toLocaleDateString('pt-BR', {
            timeZone: 'UTC'
        });

        // Retorna o HTML da tarefa usando template literal
        return `
            <li data-id="${task.id}" class="tarefa ${statusClass}">
                <div>
                    <span class="tarefa-titulo">${task.titulo}</span><br>
                    <span class="tarefa-data">Previsão: ${dateDisplay}</span>
                </div>

                <div class="acoes">
                    ${!isDone ? `<button class="btn-concluir" data-id="${task.id}">Concluir</button>` : ''}
                    <button class="btn-editar" data-id="${task.id}">Editar</button>
                    <button class="btn-excluir" data-id="${task.id}">Excluir</button>
                </div>
            </li>
        `;
    };

    // --------------------------------------------------
    // Função que busca tarefas da API e renderiza na tela
    // --------------------------------------------------
    async function fetchAndRenderTasks() {
        // Pega a ordem escolhida pelo usuário
        const orderBy = selectOrdenar.value;
        const fetchURL = `${API_BASE_URL}?orderBy=${orderBy}`;

        // Mostra mensagem enquanto carrega
        listaTarefas.innerHTML = '<li>Carregando tarefas...</li>';

        try {
            // Faz a requisição GET à API
            const response = await fetch(fetchURL);

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text);
            }

            const tasks = await response.json(); // converte resposta JSON em objeto JS

            // Se não houver tarefas
            if (tasks.length === 0) {
                listaTarefas.innerHTML = '<li>Nenhuma tarefa cadastrada ainda.</li>';
                return;
            }

            // Renderiza cada tarefa e junta tudo em uma string HTML
            listaTarefas.innerHTML = tasks.map(renderTaskHtml).join('');

            // Liga os botões de ação das tarefas
            attachActionListeners();

        } catch (err) {
            // Caso dê erro ao buscar tarefas
            listaTarefas.innerHTML = `<li style="color:red;">Erro ao carregar tarefas: ${err.message}</li>`;
        }
    }

    // --------------------------------------------------
    // Função que exclui uma tarefa
    // --------------------------------------------------
    async function handleDelete(id) {
        // Confirma com o usuário
        if (!confirm(`Excluir tarefa ID ${id}?`)) return;

        try {
            // Faz requisição DELETE
            const response = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });

            if (!response.ok) throw new Error(await response.text());

            alert("Tarefa excluída!");
            fetchAndRenderTasks(); // atualiza a lista
        } catch (err) {
            alert("Erro ao excluir tarefa.");
        }
    }

    // --------------------------------------------------
    // Função que marca uma tarefa como concluída
    // --------------------------------------------------
    async function handleConcluir(id) {
        try {
            // Faz requisição PUT para marcar como concluída
            const response = await fetch(`${API_BASE_URL}/${id}/done`, { method: 'PUT' });

            if (!response.ok) throw new Error(await response.text());

            alert("Tarefa concluída!");
            fetchAndRenderTasks(); // atualiza a lista

        } catch (err) {
            alert("Erro ao concluir tarefa.");
        }
    }

    // --------------------------------------------------
    // Função que edita uma tarefa
    // --------------------------------------------------
    async function handleEdit(id, currentTitle, currentDate) {

        // Pede ao usuário o novo título
        const novoTitulo = prompt("Novo título:", currentTitle);
        if (!novoTitulo) return;

        // Pede ao usuário a nova data
        const novaData = prompt("Nova data (AAAA-MM-DD):", currentDate);
        // Valida o formato da data
        if (!/^\d{4}-\d{2}-\d{2}$/.test(novaData)) {
            alert("Formato inválido.");
            return;
        }

        try {
            // Faz requisição PUT para atualizar a tarefa
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    titulo: novoTitulo,
                    data_prevista: novaData
                })
            });

            if (!response.ok) throw new Error(await response.text());

            alert("Tarefa editada!");
            fetchAndRenderTasks(); // atualiza a lista

        } catch (err) {
            alert("Erro ao editar tarefa.");
        }
    }

    // --------------------------------------------------
    // Função que liga os botões de ação das tarefas
    // --------------------------------------------------
    function attachActionListeners() {

        // Botão excluir
        listaTarefas.querySelectorAll('.btn-excluir')
            .forEach(btn => btn.addEventListener('click', () => {
                handleDelete(btn.dataset.id);
            }));

        // Botão concluir
        listaTarefas.querySelectorAll('.btn-concluir')
            .forEach(btn => btn.addEventListener('click', () => {
                handleConcluir(btn.dataset.id);
            }));

        // Botão editar
        listaTarefas.querySelectorAll('.btn-editar')
            .forEach(btn => btn.addEventListener('click', () => {

                const li = btn.closest('.tarefa'); // pega o <li> da tarefa
                const title = li.querySelector('.tarefa-titulo').textContent;

                // Converte data de BR (dd/mm/yyyy) para ISO (yyyy-mm-dd)
                const dataBR = li.querySelector('.tarefa-data')
                    .textContent.replace("Previsão: ", "").trim();
                const [d, m, y] = dataBR.split('/');
                const dataISO = `${y}-${m}-${d}`;

                handleEdit(btn.dataset.id, title, dataISO);
            }));
    }

    // --------------------------------------------------
    // Evento do formulário de adicionar tarefa
    // --------------------------------------------------
    formAdicionarTarefa.addEventListener('submit', async (e) => {
        e.preventDefault(); // previne recarregamento da página

        // Pega os dados do formulário
        const dados = {
            titulo: document.getElementById('titulo').value.trim(),
            data_prevista: document.getElementById('data_prevista').value
        };

        // Validação simples
        if (!dados.titulo || !dados.data_prevista) {
            alert("Preencha todos os campos.");
            return;
        }

        try {
            // Faz requisição POST para adicionar tarefa
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dados)
            });

            if (!response.ok) throw new Error(await response.text());

            formAdicionarTarefa.reset(); // limpa o formulário
            fetchAndRenderTasks(); // atualiza a lista

        } catch (err) {
            alert("Erro ao adicionar tarefa.");
        }
    });

    // --------------------------------------------------
    // Evento de mudança no select de ordenação
    // --------------------------------------------------
    selectOrdenar.addEventListener('change', fetchAndRenderTasks);

    // Chamada inicial para listar tarefas ao carregar a página
    fetchAndRenderTasks();
});
