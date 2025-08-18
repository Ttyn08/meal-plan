// ==== Sidebar hamburger menu ====
document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.querySelector('.sidebar');
    const menuIcon = document.querySelector('.menu-icon');

    if (menuIcon && sidebar) {
        menuIcon.addEventListener('click', function (event) {
            event.stopPropagation();
            sidebar.classList.toggle('active');
            sidebar.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => sidebar.classList.remove('active'));
            });
        });

        document.body.addEventListener('click', function (event) {
            if (window.innerWidth <= 1024 &&
                !sidebar.contains(event.target) &&
                !menuIcon.contains(event.target)) {
                sidebar.classList.remove('active');
            }
        });
    }
});

// shop_list.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { 
    getFirestore, collection, getDocs, updateDoc, doc, deleteDoc, orderBy, query 
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDf9M8kB7LvuCfX6XbDo3JAOuXJsuRXdQI",
    authDomain: "foodorithm-3de40.firebaseapp.com",
    projectId: "foodorithm-3de40",
    storageBucket: "foodorithm-3de40.appspot.com",
    messagingSenderId: "649166728660",
    appId: "1:649166728660:web:8207f77977fa95fc3b7a41"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const shopListContainer = document.querySelector(".shop_list");

async function loadShoppingLists(userId) {
    shopListContainer.innerHTML = "<p>Loading...</p>";

    try {
        const listsRef = collection(db, `users/${userId}/shoppingLists`);
        const q = query(listsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            shopListContainer.innerHTML = "<p>No shopping lists found.</p>";
            return;
        }

        shopListContainer.innerHTML = "<h3>Shopping Lists</h3>";

        snapshot.forEach(docSnap => {
            const listData = docSnap.data();
            const listId = docSnap.id;

            const listDiv = document.createElement("div");
            listDiv.classList.add("shopping-list-card");

            const dateStr = listData.createdAt?.toDate().toLocaleString() || "Unknown date";

            listDiv.innerHTML = `
                <div class="shopping-list-header">
                    <p><strong>Plan ID:</strong> ${listData.planId}</p>
                    <p><strong>Date Created:</strong> ${dateStr}</p>
                    <button class="delete-list-btn">Delete List</button>
                </div>
                <ul class="shopping-items"></ul>
            `;

            const ul = listDiv.querySelector(".shopping-items");

            listData.items.forEach((item, index) => {
                const li = document.createElement("li");
                li.innerHTML = `
                    <label>
                        <input type="checkbox" ${item.bought ? "checked" : ""}>
                        <span>${item.name}</span>
                    </label>
                `;

                // Update bought status in Firestore on change
                li.querySelector("input").addEventListener("change", async (e) => {
                    listData.items[index].bought = e.target.checked;
                    try {
                        await updateDoc(doc(db, `users/${userId}/shoppingLists/${listId}`), {
                            items: listData.items
                        });
                    } catch (err) {
                        console.error("Error updating item status:", err);
                    }
                });

                ul.appendChild(li);
            });

            // Delete list button
            listDiv.querySelector(".delete-list-btn").addEventListener("click", async () => {
                if (confirm("Bạn có chắc muốn xóa shopping list này không?")) {
                    try {
                        await deleteDoc(doc(db, `users/${userId}/shoppingLists/${listId}`));
                        listDiv.remove();
                    } catch (err) {
                        console.error("Error deleting list:", err);
                        alert("Không thể xóa list.");
                    }
                }
            });

            shopListContainer.appendChild(listDiv);
        });
    } catch (err) {
        console.error("Error loading shopping lists:", err);
        shopListContainer.innerHTML = "<p>Failed to load shopping lists.</p>";
    }
}

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "./signin.html";
        return;
    }
    loadShoppingLists(user.uid);
});
