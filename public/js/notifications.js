console.log("NOTIFICATIONS JS CONNECTED");

async function loadNotifications(){

const response = await fetch(
"/api/notifications",
{
headers:{
Authorization:
"Bearer " + localStorage.getItem("applicantToken")
}
}
);


const notifications = await response.json();

console.log("API RESPONSE:", notifications);

console.log("NOTIFICATIONS FROM SERVER:", notifications);

const count = document.getElementById("notificationCount");

const unreadCount = notifications.filter(note => note.read === false).length

count.innerText = unreadCount;


const box=document.getElementById(
"notificationBox"
);

box.innerHTML="";

notifications.forEach(note=>{

box.innerHTML += `

<div class="notification ${note.read ? "read" : "unread"}">

<div onclick="markAsRead('${note._id}')">

🔔 ${note.message}

<br>

<small>${new Date(note.createdAt).toLocaleString()}</small>

</div>

<button onclick="deleteNotification('${note._id}')">
Delete
</button>

</div>

`;

});


}


async function markAsRead(id){

    await fetch(`/api/notifications/${id}`, {
        method: "PUT",
        headers:{
            Authorization:
            "Bearer " + localStorage.getItem("applicantToken")
        }
    });

    loadNotifications();
}

async function markAllAsRead(){

    await fetch("/api/notifications/read-all", {

        method: "PUT",

        headers:{
            Authorization:
            "Bearer " + localStorage.getItem("applicantToken")
        }

    });

    loadNotifications();

}

async function deleteNotification(id){

    await fetch(`/api/notifications/${id}`, {

        method: "DELETE",

        headers:{
            Authorization:
            "Bearer " + localStorage.getItem("applicantToken")
        }

    });

    loadNotifications();

}

// Initial load
loadNotifications();
