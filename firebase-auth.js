// firebase-auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { firebaseConfig } from "./config-data.js";

const app = initializeApp(firebaseConfig); 
const auth = getAuth(app); 
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Force Google to prompt account selection
provider.setCustomParameters({ prompt: 'select_account' });

window.firebaseDb = db;
window.firebaseAuth = auth;

const authContainer = document.getElementById('auth-container');
const appLayout = document.getElementById('app-layout');
const btnGoogleLogin = document.getElementById('btn-google-login');
const btnAuthAction = document.getElementById('btn-auth-action');
const btnToggleAuth = document.getElementById('btn-toggle-auth');
const btnForgotPass = document.getElementById('btn-forgot-password');
const btnLogout = document.getElementById('btn-logout');

const emailInput = document.getElementById('auth-email');
const passInput = document.getElementById('auth-password');
const repassInput = document.getElementById('auth-re-password');
const repassContainer = document.getElementById('re-password-container');
const toastEl = document.getElementById('toast');

let isSignUp = false;

// --- پروفیشنل ٹوسٹ نوٹیفکیشن ---
function showAuthToast(msg) {
    if(!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.remove('translate-y-24', 'opacity-0');
    setTimeout(() => toastEl.classList.add('translate-y-24', 'opacity-0'), 4000); // 3 سے 4 سیکنڈ کر دیا گیا ہے
}

// --- یوزر فرینڈلی ایرر میسجز (Human Readable Errors) ---
function getFriendlyErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/email-already-in-use': return 'یہ ای میل پہلے سے رجسٹرڈ ہے۔ براہ کرم لاگ ان کریں۔';
        case 'auth/invalid-credential': return 'ای میل یا پاس ورڈ درست نہیں ہے۔';
        case 'auth/user-not-found': return 'اس ای میل سے کوئی اکاؤنٹ نہیں ملا۔';
        case 'auth/wrong-password': return 'پاس ورڈ غلط ہے۔';
        case 'auth/weak-password': return 'پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے۔';
        case 'auth/network-request-failed': return 'انٹرنیٹ کنکشن کا مسئلہ ہے۔ براہ کرم چیک کریں۔';
        case 'auth/too-many-requests': return 'بہت زیادہ کوششیں کی گئی ہیں۔ کچھ دیر بعد دوبارہ ٹرائی کریں۔';
        case 'auth/invalid-email': return 'براہ کرم درست ای میل فارمیٹ درج کریں۔';
        default: return 'ایک غیر متوقع مسئلہ پیش آیا۔ براہ کرم دوبارہ کوشش کریں۔';
    }
}

// --- ای میل ویلیڈیشن ---
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// --- ٹوگل لاگ ان / سائن اپ ---
if(btnToggleAuth) {
    btnToggleAuth.addEventListener('click', () => {
        isSignUp = !isSignUp;
        if(isSignUp) {
            repassContainer.classList.remove('hidden');
            btnAuthAction.textContent = 'Sign Up';
            btnToggleAuth.textContent = 'Already have an account? Login';
        } else {
            repassContainer.classList.add('hidden');
            btnAuthAction.textContent = 'Login';
            btnToggleAuth.textContent = 'Create an account';
        }
    });
}

// --- مین لاگ ان / سائن اپ ایکشن ---
if(btnAuthAction) {
    btnAuthAction.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const password = passInput.value.trim();

        // 1. Basic Validation
        if (!email || !password) return showAuthToast("Please enter email and password.");
        if (!isValidEmail(email)) return showAuthToast("Please enter a valid email address.");
        if (password.length < 6) return showAuthToast("Password must be at least 6 characters long.");

        // 2. Loading State (بہت ضروری فیچر)
        btnAuthAction.disabled = true;
        const originalText = btnAuthAction.textContent;
        btnAuthAction.textContent = 'Processing...';
        btnAuthAction.classList.add('opacity-50', 'cursor-not-allowed');

        try {
            if (isSignUp) {
                const repass = repassInput.value.trim();
                if (password !== repass) {
                    throw { custom: true, message: "Passwords do not match!" };
                }
                await createUserWithEmailAndPassword(auth, email, password);
                showAuthToast("Account created successfully!");
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                showAuthToast("Logged in successfully!");
            }
        } catch (err) {
            const errorMsg = err.custom ? err.message : getFriendlyErrorMessage(err.code);
            showAuthToast(errorMsg);
        } finally {
            // 3. Reset Button State
            btnAuthAction.disabled = false;
            btnAuthAction.textContent = originalText;
            btnAuthAction.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    });
}

// --- گوگل لاگ ان ایکشن ---
if(btnGoogleLogin) {
    btnGoogleLogin.addEventListener('click', async () => {
        btnGoogleLogin.disabled = true;
        btnGoogleLogin.classList.add('opacity-50', 'cursor-not-allowed');
        try {
            await signInWithPopup(auth, provider);
            showAuthToast("Logged in with Google!");
        } catch (err) {
            if (err.code !== 'auth/popup-closed-by-user') { // اگر یوزر خود پاپ اپ بند کر دے تو ایرر نہ دیں
                showAuthToast(getFriendlyErrorMessage(err.code));
            }
        } finally {
            btnGoogleLogin.disabled = false;
            btnGoogleLogin.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    });
}

// --- پاس ورڈ ری سیٹ ---
if(btnForgotPass) {
    btnForgotPass.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        if (!email) return showAuthToast("Please enter your email first to reset password.");
        if (!isValidEmail(email)) return showAuthToast("Please enter a valid email address.");
        
        btnForgotPass.disabled = true;
        btnForgotPass.classList.add('opacity-50', 'cursor-not-allowed');
        try {
            await sendPasswordResetEmail(auth, email);
            showAuthToast("Password reset email sent! Check your inbox.");
        } catch (err) {
            showAuthToast(getFriendlyErrorMessage(err.code));
        } finally {
            btnForgotPass.disabled = false;
            btnForgotPass.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    });
}

// --- لاگ آؤٹ ---
if(btnLogout) {
    btnLogout.addEventListener('click', async () => {
        if(confirm("Are you sure you want to logout?")) {
            try {
                await signOut(auth);
                showAuthToast("Logged out successfully.");
            } catch (err) {
                showAuthToast("Error logging out.");
            }
        }
    });
}

// --- اتھنٹیکیشن سٹیٹ آبزرور ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        if(authContainer) authContainer.classList.add('hidden');
        if(appLayout) appLayout.classList.remove('hidden');
        if(btnAuthAction) btnAuthAction.textContent = isSignUp ? 'Sign Up' : 'Login';
        window.dispatchEvent(new Event('auth-ready'));
    } else {
        if(authContainer) authContainer.classList.remove('hidden');
        if(appLayout) appLayout.classList.add('hidden');
        if(emailInput) emailInput.value = '';
        if(passInput) passInput.value = '';
        if(repassInput) repassInput.value = '';
    }
});
