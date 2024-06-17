function getCookie(name) {
let cookies = ; ${document.cookie};
let parts = cookies.split(; ${name}=);
if (parts.length === 2) return parts.pop().split(';').shift();
}

function sleep(ms) {
return new Promise(resolve => setTimeout(resolve, ms));
}

function afterUrlGenerator(cursor) {
return https://www.instagram.com/graphql/query/?query_hash=3dec7e2c57367ef3da3d987d89f9dbc8&variables={"id":"${ds_user_id}","include_reel":"true","fetch_mutual":"false","first":"24","after":"${cursor}"};
}

function unfollowUserUrlGenerator(userId) {
return https://www.instagram.com/web/friendships/${userId}/unfollow/;
}

(async function() {
let csrftoken = getCookie("csrftoken");
let ds_user_id = getCookie("ds_user_id");
let initialURL = https://www.instagram.com/graphql/query/?query_hash=3dec7e2c57367ef3da3d987d89f9dbc8&variables={"id":"${ds_user_id}","include_reel":"true","fetch_mutual":"false","first":"24"};
let doNext = true;
let filteredList = [];
let getUnfollowCounter = 0;
let scrollCicle = 0;
let followedPeople = null;

javascript

async function startScript() {
    while (doNext) {
        let response;
        try {
            response = await fetch(initialURL, {
                headers: {
                    'x-csrftoken': csrftoken,
                    'x-instagram-ajax': '1',
                    'x-requested-with': 'XMLHttpRequest',
                }
            }).then(res => res.json());
        } catch (error) {
            console.error('Error en la petición:', error);
            continue;
        }

        if (!followedPeople) {
            followedPeople = response.data.user.edge_follow.count;
        }

        doNext = response.data.user.edge_follow.page_info.has_next_page;
        initialURL = afterUrlGenerator(response.data.user.edge_follow.page_info.end_cursor);
        getUnfollowCounter += response.data.user.edge_follow.edges.length;

        response.data.user.edge_follow.edges.forEach(edge => {
            if (!edge.node.follows_viewer) {
                filteredList.push(edge.node);
            }
        });

        console.clear();
        console.log(`%c Progreso ${getUnfollowCounter}/${followedPeople} (${parseInt(100 * (getUnfollowCounter / followedPeople))}%)`, "background: #222; color: #bada55; font-size: 35px;");
        console.log("%c Estos usuarios no te siguen de vuelta (en progreso):", "background: #222; color: #FC4119; font-size: 13px;");
        filteredList.forEach(user => console.log(user.username));

        await sleep(Math.floor(400 * Math.random()) + 1000);
        scrollCicle++;

        if (scrollCicle > 6) {
            scrollCicle = 0;
            console.log("%c Durmiendo 10 segundos para evitar bloqueo temporal", "background: #222; color: #FF0000; font-size: 35px;");
            await sleep(10000);
        }
    }

    createMenu();
    displayUsers(filteredList);

    console.log("%c ¡Todo HECHO!", "background: #222; color: #bada55; font-size: 25px;");
}

function createMenu() {
    let menu = document.createElement('div');
    menu.id = 'instagram-follow-menu';
    menu.style.position = 'fixed';
    menu.style.top = '10px';
    menu.style.right = '10px';
    menu.style.backgroundColor = 'white';
    menu.style.border = '1px solid black';
    menu.style.padding = '10px';
    menu.style.zIndex = 10000;
    menu.style.maxHeight = '90vh';
    menu.style.overflowY = 'scroll';

    let title = document.createElement('h3');
    title.textContent = 'Seguidores de Instagram';
    menu.appendChild(title);

    let unfollowButton = document.createElement('button');
    unfollowButton.textContent = 'Dejar de seguir seleccionados';
    unfollowButton.onclick = unfollowSelected;
    menu.appendChild(unfollowButton);

    let usersList = document.createElement('ul');
    usersList.id = 'users-list';
    menu.appendChild(usersList);

    document.body.appendChild(menu);
}

function displayUsers(users) {
    let list = document.getElementById('users-list');
    users.forEach(user => {
        let listItem = document.createElement('li');
        listItem.style.marginBottom = '10px';

        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = user.id;

        let label = document.createElement('label');
        label.textContent = user.username;

        listItem.appendChild(checkbox);
        listItem.appendChild(label);
        list.appendChild(listItem);
    });
}

async function unfollowSelected() {
    let checkboxes = document.querySelectorAll('#users-list input[type="checkbox"]:checked');
    for (let checkbox of checkboxes) {
        let userId = checkbox.value;
        try {
            await fetch(unfollowUserUrlGenerator(userId), {
                method: 'POST',
                headers: {
                    'x-csrftoken': csrftoken,
                    'x-instagram-ajax': '1',
                    'x-requested-with': 'XMLHttpRequest',
                }
            });
            console.log(`Dejaste de seguir a ${userId}`);
        } catch (error) {
            console.error(`Error al dejar de seguir a ${userId}:`, error);
        }
        await sleep(1000); // Esperar un segundo entre cada solicitud para evitar bloqueos
    }
}

startScript();
