document.addEventListener('DOMContentLoaded', () => {
    
    const formAdicionarTarefa = document.getElementById('form-adicionar-tarefa');
    const listaTarefas = document.getElementById('lista-tarefas');
    const selectOrdenar = document.getElementById('ordenar');

    const API_BASE_URL = 'http://localhost:2009/tasks';

    // --------------------------------------
    // GERA O HTML DE UMA TAREFA
    // --------------------------------------
    const renderTaskHtml = (task) => {
        const isDone = task.status === 'concluida';
        const statusClass = isDone ? 'concluida' : 'pendente';

        const dateDisplay = new Date(task.data_prevista).toLocaleDateString('pt-BR', {
            timeZone: 'UTC'
        });

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

    // --------------------------------------
    // LISTAR TAREFAS
    // --------------------------------------
    async function fetchAndRenderTasks() {
        const orderBy = selectOrdenar.value;
        const fetchURL = `${API_BASE_URL}?orderBy=${orderBy}`;

        listaTarefas.innerHTML = '<li>Carregando tarefas...</li>';

        try {
            const response = await fetch(fetchURL);

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text);
            }

            const tasks = await response.json();

            if (tasks.length === 0) {
                listaTarefas.innerHTML = '<li>Nenhuma tarefa cadastrada ainda.</li>';
                return;
            }

            listaTarefas.innerHTML = tasks.map(renderTaskHtml).join('');

            attachActionListeners();

        } catch (err) {
            listaTarefas.innerHTML = `<li style="color:red;">Erro ao carregar tarefas: ${err.message}</li>`;
        }
    }

    // --------------------------------------
    // EXCLUIR TAREFA
    // --------------------------------------
    async function handleDelete(id) {
        if (!confirm(`Excluir tarefa ID ${id}?`)) return;

        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });

            if (!response.ok) throw new Error(await response.text());

            alert("Tarefa excluída!");
            fetchAndRenderTasks();
        } catch (err) {
            alert("Erro ao excluir tarefa.");
        }
    }

    // --------------------------------------
    // CONCLUIR TAREFA
    // --------------------------------------
    async function handleConcluir(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}/done`, { method: 'PUT' });

            if (!response.ok) throw new Error(await response.text());

            alert("Tarefa concluída!");
            fetchAndRenderTasks();

        } catch (err) {
            alert("Erro ao concluir tarefa.");
        }
    }

    // --------------------------------------
    // EDITAR TAREFA
    // --------------------------------------
    async function handleEdit(id, currentTitle, currentDate) {

        const novoTitulo = prompt("Novo título:", currentTitle);
        if (!novoTitulo) return;

        const novaData = prompt("Nova data (AAAA-MM-DD):", currentDate);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(novaData)) {
            alert("Formato inválido.");
            return;
        }

        try {
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
            fetchAndRenderTasks();

        } catch (err) {
            alert("Erro ao editar tarefa.");
        }
    }

    // --------------------------------------
    // LIGAR BOTÕES DE AÇÃO
    // --------------------------------------
    function attachActionListeners() {

        // excluir
        listaTarefas.querySelectorAll('.btn-excluir')
            .forEach(btn => btn.addEventListener('click', () => {
                handleDelete(btn.dataset.id);
            }));

        // concluir
        listaTarefas.querySelectorAll('.btn-concluir')
            .forEach(btn => btn.addEventListener('click', () => {
                handleConcluir(btn.dataset.id);
            }));

        // editar
        listaTarefas.querySelectorAll('.btn-editar')
            .forEach(btn => btn.addEventListener('click', () => {

                const li = btn.closest('.tarefa');
                const title = li.querySelector('.tarefa-titulo').textContent;

                const dataBR = li.querySelector('.tarefa-data')
                    .textContent.replace("Previsão: ", "").trim();

                const [d, m, y] = dataBR.split('/');
                const dataISO = `${y}-${m}-${d}`;

                handleEdit(btn.dataset.id, title, dataISO);
            }));
    }

    // --------------------------------------
    // ADICIONAR TAREFA
    // --------------------------------------
    formAdicionarTarefa.addEventListener('submit', async (e) => {
        e.preventDefault();

        const dados = {
            titulo: document.getElementById('titulo').value.trim(),
            data_prevista: document.getElementById('data_prevista').value
        };

        if (!dados.titulo || !dados.data_prevista) {
            alert("Preencha todos os campos.");
            return;
        }

        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dados)
            });

            if (!response.ok) throw new Error(await response.text());

            formAdicionarTarefa.reset();
            fetchAndRenderTasks();

        } catch (err) {
            alert("Erro ao adicionar tarefa.");
        }
    });

    // --------------------------------------
    // INICIAR LISTA
    // --------------------------------------
    selectOrdenar.addEventListener('change', fetchAndRenderTasks);
    fetchAndRenderTasks();
});
