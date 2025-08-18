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

// ==== Firebase config ====
const SPOONACULAR_API_KEY = "b241ac35dcaf4d9ca66be8cea4517688";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
    getFirestore, doc, getDoc, setDoc,
    collection, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDf9M8kB7LvuCfX6XbDo3JAOuXJsuRXdQI",
    authDomain: "foodorithm-3de40.firebaseapp.com",
    projectId: "foodorithm-3de40",
    storageBucket: "foodorithm-3de40.firebasestorage.app",
    messagingSenderId: "649166728660",
    appId: "1:649166728660:web:8207f77977fa95fc3b7a41"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==== Global state ====
let currentUser = null;
let currentMealPlan = null;
let currentCalories = null;
let currentDuration = "1-day";

// ==== Helpers ====
const $ = (sel) => document.querySelector(sel);

function calculateTDEE(profile) {
    const { sex, weight, weightUnit, height, heightUnit, activityLevel, birthday } = profile;
    if (!sex || !weight || !height || !activityLevel || !birthday?.year) return null;

    const weightKg = weightUnit === 'lb' ? weight * 0.453592 : weight;
    const heightCm = heightUnit === 'in' ? height * 2.54 : height;

    const today = new Date();
    const birthDate = new Date(birthday.year, birthday.month - 1, birthday.day);
    let age = today.getFullYear() - birthDate.getFullYear();
    if (today < new Date(today.getFullYear(), birthday.month - 1, birthday.day)) age--;

    let bmr = sex === 'male'
        ? (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5
        : (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;

    const activityMultipliers = {
        'sedentary': 1.2,
        'lightly-active': 1.375,
        'moderately-active': 1.55,
        'very-active': 1.725,
        'extra-active': 1.9,
    };

    return Math.round(bmr * activityMultipliers[activityLevel]);
}

function guessMealType(title) {
    const lower = title.toLowerCase();
    if (lower.includes("breakfast") || lower.includes("pancake") || lower.includes("omelet")) return "breakfast";
    if (lower.includes("lunch") || lower.includes("sandwich") || lower.includes("salad")) return "lunch";
    if (lower.includes("dinner") || lower.includes("steak") || lower.includes("pasta")) return "dinner";
    if (lower.includes("brunch")) return "brunch";
    if (lower.includes("juice") || lower.includes("smoothie") || lower.includes("coffee")) return "beverage";
    if (lower.includes("cake") || lower.includes("pie") || lower.includes("dessert")) return "dessert";
    return "lunch";
}

async function fetchMealDetails(id) {
    const url = `https://api.spoonacular.com/recipes/${id}/information?includeNutrition=true&apiKey=${SPOONACULAR_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch recipe ${id}`);
    return res.json();
}

async function fetchMealPlanFromAPI(duration, calories) {
    const plan = { days: [] };

    if (duration === "1-day") {
        plan.days.push(await getDayPlan(calories));

    } else if (duration === "3-days") {
        for (let i = 0; i < 3; i++) {
            plan.days.push(await getDayPlan(calories));
        }

    } else if (duration === "1-week") {
        const url = `https://api.spoonacular.com/mealplanner/generate?timeFrame=week&targetCalories=${calories}&apiKey=${SPOONACULAR_API_KEY}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("API error week plan");
        const data = await res.json();
        for (const dayName of Object.keys(data.week)) {
            const meals = await Promise.all(
                data.week[dayName].meals.map(async m => {
                    const d = await fetchMealDetails(m.id);
                    return {
                        type: guessMealType(m.title),
                        title: m.title,
                        calories: Math.round(d.nutrition?.nutrients?.find(n => n.name === "Calories")?.amount || 0),
                        image: d.image,
                        ingredients: d.extendedIngredients?.map(i => i.name) || []
                    };
                })
            );
            plan.days.push({ meals });
        }
    }
    return plan;
}

// async function getDayPlan(calories) {
//     const url = `https://api.spoonacular.com/mealplanner/generate?timeFrame=day&targetCalories=${calories}&apiKey=${SPOONACULAR_API_KEY}`;
//     const res = await fetch(url);
//     if (!res.ok) throw new Error("API error day plan");
//     const data = await res.json();
//     const meals = await Promise.all(
//         data.meals.map(async m => {
//             const d = await fetchMealDetails(m.id);
//             return {
//                 type: guessMealType(m.title),
//                 title: m.title,
//                 calories: Math.round(d.nutrition?.nutrients?.find(n => n.name === "Calories")?.amount || 0),
//                 image: d.image,
//                 ingredients: d.extendedIngredients?.map(i => i.name) || []
//             };
//         })
//     );
//     return { meals };
// }

async function getDayPlan(calories) {
    // 1. Gọi API mealplanner generate
    const url = `https://api.spoonacular.com/mealplanner/generate?timeFrame=day&targetCalories=${calories}&apiKey=${SPOONACULAR_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("API error day plan");
    const data = await res.json();

    // 2. Lấy chi tiết từng món trong kết quả ban đầu
    let meals = await Promise.all(
        data.meals.map(async m => {
            const d = await fetchMealDetails(m.id);
            return {
                type: guessMealType(m.title),
                title: m.title,
                calories: Math.round(d.nutrition?.nutrients?.find(n => n.name === "Calories")?.amount || 0),
                image: d.image,
                ingredients: d.extendedIngredients?.map(i => i.name) || []
            };
        })
    );

    // 3. Nhóm theo loại bữa ăn
    const mealGroups = {
        breakfast: [],
        lunch: [],
        dinner: [],
        brunch: [],
        beverage: [],
        dessert: []
    };
    meals.forEach(m => {
        if (mealGroups[m.type]) mealGroups[m.type].push(m);
    });

    // 4. Bổ sung bữa thiếu (chỉ 3 bữa chính)
    for (const mealType of ["breakfast", "lunch", "dinner"]) {
        if (mealGroups[mealType].length === 0) {
            console.log(`Thiếu ${mealType}, gọi API bổ sung...`);
            // Gọi complexSearch để tìm món cho bữa này
            const searchUrl = `https://api.spoonacular.com/recipes/complexSearch?type=${mealType}&number=3&apiKey=${SPOONACULAR_API_KEY}`;
            const searchRes = await fetch(searchUrl);
            if (searchRes.ok) {
                const searchData = await searchRes.json();
                const extraMeals = await Promise.all(
                    searchData.results.map(async r => {
                        const d = await fetchMealDetails(r.id);
                        return {
                            type: mealType,
                            title: d.title,
                            calories: Math.round(d.nutrition?.nutrients?.find(n => n.name === "Calories")?.amount || 0),
                            image: d.image,
                            ingredients: d.extendedIngredients?.map(i => i.name) || []
                        };
                    })
                );
                mealGroups[mealType] = extraMeals;
            }
        }
    }

    // 5. Gộp tất cả món thành 1 mảng theo định dạng ban đầu
    const allMeals = Object.values(mealGroups).flat().slice(0, 18); // giới hạn tổng số món trong ngày
    return { meals: allMeals };
}


// function renderMealPlan(plan) {
//     const container = $(".plan-editor");
//     container.innerHTML = "";
//     if (!plan?.days) {
//         container.innerHTML = "<p>No plan data available.</p>";
//         return;
//     }
//     plan.days.forEach((day, idx) => {
//         const dayDiv = document.createElement("div");
//         dayDiv.classList.add("day-plan");
//         dayDiv.innerHTML = `<h4>Day ${idx + 1}</h4>`;
//         const mealGroups = {
//             breakfast: [], brunch: [], lunch: [], dinner: [], beverage: [], dessert: []
//         };
//         day.meals.forEach(m => { if (mealGroups[m.type]) mealGroups[m.type].push(m); });

//         Object.entries(mealGroups).forEach(([type, meals]) => {
//             if (meals.length === 0) return;
//             const sec = document.createElement("div");
//             sec.classList.add("meal-section");
//             sec.innerHTML = `<h5>${type}</h5>`;
//             meals.forEach(m => {
//                 sec.innerHTML += `
//                     <div class="meal-card">
//                         <img src="${m.image}" alt="${m.title}">
//                         <div class="meal-info">
//                             <h6>${m.title}</h6>
//                             <p>${m.calories} kcal</p>
//                             <p><strong>Ingredients:</strong> ${m.ingredients.join(", ")}</p>
//                         </div>
//                     </div>`;
//             });
//             dayDiv.appendChild(sec);
//         });
//         container.appendChild(dayDiv);
//     });
// }

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

        // Các nhóm bữa ăn bắt buộc và bổ sung
        const mealGroups = {
            breakfast: [],
            lunch: [],
            dinner: [],
            brunch: [],
            beverage: [],
            dessert: []
        };

        // Phân loại món ăn
        day.meals.forEach(m => {
            if (mealGroups[m.type]) mealGroups[m.type].push(m);
        });

        // Đảm bảo 3 bữa chính luôn có (kể cả khi rỗng)
        ["breakfast", "lunch", "dinner"].forEach(type => {
            if (!mealGroups[type]) mealGroups[type] = [];
        });

        // Render từng nhóm
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


async function saveMealPlanToFirestore() {
    if (!currentUser || !currentMealPlan) return alert("No plan to save.");
    try {
        const ref = doc(collection(db, `users/${currentUser.uid}/mealPlans`));
        await setDoc(ref, {
            createdAt: serverTimestamp(),
            caloriesPerDay: currentCalories,
            duration: currentDuration,
            plan: currentMealPlan
        });
        alert("Meal plan saved!");
    } catch (e) {
        console.error(e);
        alert("Save failed.");
    }
}

// ==== Generate plan (dùng chung cho Create + Change) ====
async function generateAndRenderPlan() {
    const selectedRadio = document.querySelector("input[name='plan-duration']:checked");
    if (selectedRadio) currentDuration = selectedRadio.value;

    if (!currentCalories) {
        alert("Calories not set. Please complete your profile.");
        return;
    }

    const plan = await fetchMealPlanFromAPI(currentDuration, currentCalories);
    currentMealPlan = plan;
    renderMealPlan(plan);
}

// ==== Main init ====
document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) return window.location.href = "./signin.html";
        currentUser = user;

        const profile = await getDoc(doc(db, "users", user.uid)).then(s => s.data());
        if (!profile) {
            alert("No profile found. Please set your profile first.");
            return window.location.href = "./set_profile.html";
        }

        currentCalories = profile.TDEE || calculateTDEE(profile) || 2000;
    });

    // Gán chung hàm cho cả Create và Change
    $(".create-btn").addEventListener("click", generateAndRenderPlan);
    $(".change-plan-btn").addEventListener("click", generateAndRenderPlan);

    $(".save-plan-btn").addEventListener("click", saveMealPlanToFirestore);
});
