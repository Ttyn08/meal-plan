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

// saved_plans.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { 
    getFirestore, collection, getDocs, orderBy, query, deleteDoc, doc, setDoc, getDoc 
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

const $ = (sel) => document.querySelector(sel);

function renderMealPlan(plan) {
    const container = $(".plan-editor");
    container.innerHTML = "";
    if (!plan?.days) {
        container.innerHTML = "<p>No plan data available.</p>";
        return;
    }

    plan.days.forEach((day, idx) => {
        const dayDiv = document.createElement("div");
        dayDiv.classList.add("day-plan");
        dayDiv.innerHTML = `<h4>Day ${idx + 1}</h4>`;

        const mealGroups = {
            breakfast: [], lunch: [], dinner: [], brunch: [], beverage: [], dessert: []
        };

        day.meals.forEach(m => {
            if (mealGroups[m.type]) mealGroups[m.type].push(m);
        });

        ["breakfast", "lunch", "dinner"].forEach(type => {
            if (!mealGroups[type]) mealGroups[type] = [];
        });

        Object.entries(mealGroups).forEach(([type, meals]) => {
            if (["breakfast", "lunch", "dinner"].includes(type) || meals.length > 0) {
                const sec = document.createElement("div");
                sec.classList.add("meal-section");
                sec.innerHTML = `<h5>${type}</h5>`;

                if (meals.length === 0) {
                    sec.innerHTML += `<p class="no-meal">Chưa có món</p>`;
                } else {
                    meals.slice(0, 3).forEach(m => {
                        sec.innerHTML += `
                            <div class="meal-card">
                                <img src="${m.image}" alt="${m.title}">
                                <div class="meal-info">
                                    <h6>${m.title}</h6>
                                    <p>${m.calories} kcal</p>
                                    <p><strong>Ingredients:</strong> ${m.ingredients.join(", ")}</p>
                                </div>
                            </div>`;
                    });
                }
                dayDiv.appendChild(sec);
            }
        });

        container.appendChild(dayDiv);
    });
}

async function deleteMealPlan(userId, planId, planCard) {
    if (!confirm("Bạn có chắc muốn xóa meal plan này không?")) return;

    try {
        await deleteDoc(doc(db, `users/${userId}/mealPlans`, planId));
        planCard.remove();
        $(".plan-editor").innerHTML = "<p>Plan deleted.</p>";
        alert("Meal plan deleted successfully.");
    } catch (err) {
        console.error("Error deleting plan:", err);
        alert("Failed to delete meal plan.");
    }
}

// ===== NEW: Tạo Shopping List =====
async function createShoppingList(userId, planId, planData) {
    try {
        const shopListRef = doc(db, `users/${userId}/shoppingLists`, planId);
        const existing = await getDoc(shopListRef);
        if (existing.exists()) {
            alert("Plan này đã có shopping list rồi. Bạn có thể chỉnh sửa trong trang Shopping List.");
            return;
        }

        // Lấy tất cả nguyên liệu từ plan, loại trùng
        let ingredientsSet = new Set();
        planData.days.forEach(day => {
            day.meals.forEach(meal => {
                meal.ingredients.forEach(ing => {
                    ingredientsSet.add(ing.trim());
                });
            });
        });

        const ingredientsArray = Array.from(ingredientsSet).map(item => ({
            name: item,
            bought: false
        }));

        await setDoc(shopListRef, {
            planId,
            createdAt: new Date(),
            items: ingredientsArray
        });

        alert("Shopping list đã được tạo thành công!");
    } catch (err) {
        console.error("Error creating shopping list:", err);
        alert("Không thể tạo shopping list.");
    }
}

async function loadSavedPlans(userId) {
    const plansContainer = document.querySelector(".save_plan");
    plansContainer.innerHTML = "<p>Loading...</p>";

    try {
        const plansRef = collection(db, `users/${userId}/mealPlans`);
        const q = query(plansRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            plansContainer.innerHTML = "<p>No saved meal plans found.</p>";
            return;
        }

        plansContainer.innerHTML = "<h3>Saved Meal Plans</h3>";
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const planId = docSnap.id;
            const dateStr = data.createdAt?.toDate().toLocaleString() || "Unknown date";

            const planCard = document.createElement("div");
            planCard.classList.add("saved-plan-card");
            planCard.innerHTML = `
                <div class="saved-plan-header">
                    <p><strong>Date saved:</strong> ${dateStr}</p>
                    <p><strong>Calories/day:</strong> ${data.caloriesPerDay}</p>
                    <p><strong>Duration:</strong> ${data.duration}</p>
                </div>
                <div class="plan-actions">
                    <button class="view-plan-btn">View Plan</button>
                    <button class="delete-plan-btn">Delete</button>
                    <button class="create-shoplist-btn">Create Shopping List</button>
                </div>
            `;

            planCard.querySelector(".view-plan-btn").addEventListener("click", () => {
                renderMealPlan(data.plan);
            });

            planCard.querySelector(".delete-plan-btn").addEventListener("click", () => {
                deleteMealPlan(userId, planId, planCard);
            });

            planCard.querySelector(".create-shoplist-btn").addEventListener("click", () => {
                createShoppingList(userId, planId, data.plan);
            });

            plansContainer.appendChild(planCard);
        });
    } catch (err) {
        console.error("Error loading saved plans:", err);
        plansContainer.innerHTML = "<p>Failed to load saved plans.</p>";
    }
}

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "./signin.html";
        return;
    }
    loadSavedPlans(user.uid);
});
