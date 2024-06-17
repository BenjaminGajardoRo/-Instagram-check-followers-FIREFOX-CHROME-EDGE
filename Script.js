// Función para obtener una cookie por su nombre
function obtenerCookie(nombre) {
    const cookies = `; ${document.cookie}`;
    const partes = cookies.split(`; ${nombre}=`);
    if (partes.length === 2) {
        return partes.pop().split(';').shift();
    }
    return null; // Manejar el caso en que no se encuentre la cookie
}

// Función para pausar la ejecución por un tiempo determinado
function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Función para traducir texto basado en el idioma
function traducir(texto, idioma) {
    const traducciones = {
        'es': {
            progreso: 'Progreso',
            noTeSiguen: 'Estos usuarios no te siguen de vuelta:',
            durmiendo: 'Descansando 10 segundos para evitar bloqueo temporal',
            todoHecho: 'Todo listo jefx',
            seguidoresInstagram: 'Seguidores de Instagram',
            dejarDeSeguirSeleccionados: 'Dejar de seguir seleccionados',
            dejasteDeSeguir: 'Dejaste de seguir a',
            errorDejarDeSeguir: 'Error al dejar de seguir a'
        },
        'en': {
            progreso: 'Progress',
            noTeSiguen: 'These users do not follow you back:',
            durmiendo: 'Sleeping for 10 seconds to avoid temporary block',
            todoHecho: 'All DONE!',
            seguidoresInstagram: 'Instagram Followers',
            dejarDeSeguirSeleccionados: 'Unfollow selected',
            dejasteDeSeguir: 'Unfollowed',
            errorDejarDeSeguir: 'Error unfollowing'
        }
        // Agregar más idiomas según sea necesario
    };
    return (traducciones[idioma] && traducciones[idioma][texto]) || texto;
}

// Función para generar la URL de la siguiente página de usuarios seguidos
function generarUrlSiguiente(cursor, ds_user_id) {
    return `https://www.instagram.com/graphql/query/?query_hash=3dec7e2c57367ef3da3d987d89f9dbc8&variables={"id":"${ds_user_id}","include_reel":"true","fetch_mutual":"false","first":"24","after":"${cursor}"}`;
}

// Función para generar la URL para dejar de seguir a un usuario
function generarUrlDejarDeSeguir(userId) {
    return `https://www.instagram.com/web/friendships/${userId}/unfollow/`;
}

// Función para crear el menú en la página
function crearMenu() {
    let menu = document.createElement('div');
    menu.id = 'instagram-follow-menu';
    menu.style.position = 'fixed';
    menu.style.top = '10px';
    menu.style.right = '10px';
    menu.style.backgroundColor = getComputedStyle(document.body).backgroundColor;
    menu.style.border = '1px solid #dbdbdb';
    menu.style.padding = '10px';
    menu.style.zIndex = 10000;
    menu.style.maxHeight = '90vh';
    menu.style.overflowY = 'scroll';
    menu.style.borderRadius = '8px';
    menu.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';

    let titulo = document.createElement('h3');
    titulo.textContent = traducir('seguidoresInstagram', document.documentElement.lang);
    titulo.style.color = getComputedStyle(document.body).color;
    menu.appendChild(titulo);

    let botonDejarDeSeguir = document.createElement('button');
    botonDejarDeSeguir.textContent = traducir('dejarDeSeguirSeleccionados', document.documentElement.lang);
    botonDejarDeSeguir.style.backgroundColor = '#3897f0';
    botonDejarDeSeguir.style.color = '#fff';
    botonDejarDeSeguir.style.border = 'none';
    botonDejarDeSeguir.style.borderRadius = '4px';
    botonDejarDeSeguir.style.padding = '10px';
    botonDejarDeSeguir.style.cursor = 'pointer';
    botonDejarDeSeguir.onclick = dejarDeSeguirSeleccionados;
    menu.appendChild(botonDejarDeSeguir);

    let listaUsuarios = document.createElement('ul');
    listaUsuarios.id = 'users-list';
    menu.appendChild(listaUsuarios);

    document.body.appendChild(menu);
}

// Función para mostrar los usuarios filtrados en el menú
function mostrarUsuarios(usuarios) {
    let lista = document.getElementById('users-list');
    lista.innerHTML = ''; // Limpiar la lista antes de agregar nuevos usuarios
    usuarios.forEach(user => {
        let elementoLista = document.createElement('li');
        elementoLista.style.marginBottom = '10px';

        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = user.id;

        let etiqueta = document.createElement('label');
        etiqueta.textContent = user.username;
        etiqueta.style.color = getComputedStyle(document.body).color;

        elementoLista.appendChild(checkbox);
        elementoLista.appendChild(etiqueta);
        lista.appendChild(elementoLista);
    });
}

// Función para dejar de seguir a los usuarios seleccionados
async function dejarDeSeguirSeleccionados() {
    let checkboxes = document.querySelectorAll('#users-list input[type="checkbox"]:checked');
    for (let checkbox of checkboxes) {
        let userId = checkbox.value;
        try {
            await fetch(generarUrlDejarDeSeguir(userId), {
                method: 'POST',
                headers: {
                    'x-csrftoken': obtenerCookie('csrftoken'),
                    'x-instagram-ajax': '1',
                    'x-requested-with': 'XMLHttpRequest',
                }
            });
            console.log(`%c ${traducir('dejasteDeSeguir', document.documentElement.lang)} ${userId}`, "background: #000; color: #bada55; font-size: 13px;");
        } catch (error) {
            console.error(`%c ${traducir('errorDejarDeSeguir', document.documentElement.lang)} ${userId}: ${error}`, "background: #000; color: #FF0000; font-size: 13px;");
        }
        await esperar(1000); // Esperar un segundo entre cada solicitud para evitar bloqueos
    }
}

// Función principal asincrónica que inicia el script
(async function() {
    let csrftoken = obtenerCookie("csrftoken");
    let ds_user_id = obtenerCookie("ds_user_id");

    if (!csrftoken || !ds_user_id) {
        console.error('%c No se pudo obtener csrftoken o ds_user_id de las cookies.', "background: #000; color: #FF0000; font-size: 13px;");
        return;
    }

    let idioma = document.documentElement.lang;
    let urlInicial = `https://www.instagram.com/graphql/query/?query_hash=3dec7e2c57367ef3da3d987d89f9dbc8&variables={"id":"${ds_user_id}","include_reel":"true","fetch_mutual":"false","first":"24"}`;
    let continuar = true;
    let listaFiltrada = [];
    let contadorUsuarios = 0;
    let cicloDesplazamiento = 0;
    let totalSeguidos = null;

    while (continuar) {
        let respuesta;
        try {
            respuesta = await fetch(urlInicial, {
                headers: {
                    'x-csrftoken': csrftoken,
                    'x-instagram-ajax': '1',
                    'x-requested-with': 'XMLHttpRequest',
                }
            }).then(res => res.json());
        } catch (error) {
            console.error('%c Error en la petición:', error, "background: #000; color: #FF0000; font-size: 13px;");
            continue;
        }

        if (!totalSeguidos) {
            totalSeguidos = respuesta.data.user.edge_follow.count;
        }

        continuar = respuesta.data.user.edge_follow.page_info.has_next_page;
        urlInicial = generarUrlSiguiente(respuesta.data.user.edge_follow.page_info.end_cursor, ds_user_id);
        contadorUsuarios += respuesta.data.user.edge_follow.edges.length;

        respuesta.data.user.edge_follow.edges.forEach(edge => {
            if (!edge.node.follows_viewer) {
                listaFiltrada.push(edge.node);
            }
        });

        console.clear();
        console.log(`%c ${traducir('progreso', idioma)} ${contadorUsuarios}/${totalSeguidos} (${parseInt(100 * (contadorUsuarios / totalSeguidos))}%)`, "background: #000; color: #bada55; font-size: 35px;");
        console.log(`%c ${traducir('noTeSiguen', idioma)}`, "background: #000; color: #FC4119; font-size: 13px;");
        listaFiltrada.forEach(user => console.log(`%c ${user.username}`, "background: #000; color: #ffffff; font-size: 13px;"));

        await esperar(Math.floor(400 * Math.random()) + 1000);
        cicloDesplazamiento++;

        if (cicloDesplazamiento > 6) {
            cicloDesplazamiento = 0;
            console.log(`%c ${traducir('durmiendo', idioma)}`, "background: #000; color: #FF0000; font-size: 35px;");
            await esperar(10000);
        }
    }

    crearMenu();
    mostrarUsuarios(listaFiltrada);

    console.log(`%c ${traducir('todoHecho', idioma)}`, "background: #000; color: #bada55; font-size: 25px;");
})();
