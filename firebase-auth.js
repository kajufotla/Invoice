// firebase-auth.js - Enterprise Ready SaaS Code
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    sendPasswordResetEmail, 
    onAuthStateChanged, 
    signOut,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { firebaseConfig } from "./config-data.js";

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig); 
const auth = getAuth(app); 
const db = getFirestore(app);

// --- Google Provider Configuration ---
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });
provider.addScope('email');
provider.addScope('profile');

window.firebaseDb = db;
window.firebaseAuth = auth;

// --- DOM Elements ---
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
const rememberMeCheck = document.getElementById('remember-me'); // Optional UI element

// --- State Management ---
let isSignUp = false;
let isProcessing = false; // Loading Protection
let failedLoginAttempts = 0;
let loginLockoutUntil = 0;
const lastVerificationResend = {}; // Tracks resend timestamps per email

// --- Default Session Persistence Setup ---
setPersistence(auth, browserLocalPersistence)
    .catch((error) => logError(error, "Initial Persistence Setup"));

// --- Enterprise Utilities & Error Logging ---

/**
 * Standardized error logger for potential Crashlytics/Sentry integration
 */
function logError(error, context = 'General') {
    console.error(`[Auth Error - ${context}]:`, error);
    // TODO: Integrate Sentry.captureException(error) or Firebase Crashlytics here
}

function showAuthToast(msg, type = 'info') {
    if(!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.remove('translate-y-24', 'opacity-0');
    setTimeout(() => toastEl.classList.add('translate-y-24', 'opacity-0'), 5000);
}

function getFriendlyErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/email-already-in-use': return 'This email is already registered. Please log in.';
        case 'auth/invalid-credential': return 'Invalid email or password combination.';
        case 'auth/user-not-found': return 'No account found with this email.';
        case 'auth/wrong-password': return 'Incorrect password.';
        case 'auth/network-request-failed': return 'Network issue detected. Please check your connection.';
        case 'auth/too-many-requests': return 'Too many requests. Please try again later.';
        case 'auth/invalid-email': return 'Please enter a valid email address.';
        case 'auth/popup-blocked': return 'Sign-in popup blocked by browser. Please allow popups.';
        default: return 'An unexpected error occurred. Please try again.';
    }
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateStrongPassword(password) {
    if (password.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter.";
    if (!/\d/.test(password)) return "Password must contain at least one number.";
    if (!/[@$!%*?&#]/.test(password)) return "Password must contain at least one special character.";
    return null;
}

function toggleInputsState(isDisabled) {
    if(emailInput) emailInput.disabled = isDisabled;
    if(passInput) passInput.disabled = isDisabled;
    if(repassInput) repassInput.disabled = isDisabled;
}

/**
 * Checks for offline status to prevent hanging requests
 */
function isNetworkOffline() {
    if (!navigator.onLine) {
        showAuthToast("You appear to be offline. Please check your internet connection.", "error");
        return true;
    }
    return false;
}

// --- Security: Rate Limiting ---
function checkRateLimit() {
    if (Date.now() < loginLockoutUntil) {
        const remainingSecs = Math.ceil((loginLockoutUntil - Date.now()) / 1000);
        throw { custom: true, message: `Too many failed attempts. Try again in ${remainingSecs} seconds.` };
    }
}

function handleFailedLogin(errorCode) {
    // Only rate limit on bad credentials, not network or systemic errors
    const rateLimitTriggers = ['auth/wrong-password', 'auth/invalid-credential', 'auth/user-not-found'];
    
    if (rateLimitTriggers.includes(errorCode)) {
        failedLoginAttempts++;
        if (failedLoginAttempts >= 4) {
            loginLockoutUntil = Date.now() + 60000; // 60 seconds lockout
            failedLoginAttempts = 0; 
            throw { custom: true, message: `Account locked due to multiple failed attempts. Try again in 60 seconds.` };
        }
    }
}

// --- Firestore: User Profile Management ---
async function syncUserProfile(user, providerId) {
    if (!user) return;
    try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email.split('@')[0],
                provider: providerId,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp()
            });
        } else {
            await updateDoc(userRef, {
                lastLogin: serverTimestamp()
            });
        }
    } catch (error) {
        logError(error, "Sync User Profile");
    }
}

// --- Dynamic Persistence Setup ---
async function configurePersistence() {
    // If a 'Remember Me' checkbox exists and is unchecked, use session persistence. Otherwise, default to local.
    const persistenceType = (rememberMeCheck && !rememberMeCheck.checked) ? browserSessionPersistence : browserLocalPersistence;
    await setPersistence(auth, persistenceType);
}

// --- Event Listeners ---

if(btnToggleAuth) {
    btnToggleAuth.addEventListener('click', () => {
        if (isProcessing) return;
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

// Main Email Login / Sign Up Action
if(btnAuthAction) {
    btnAuthAction.addEventListener('click', async () => {
        if (isProcessing) return;
        if (isNetworkOffline()) return;

        const email = emailInput.value.trim();
        const password = passInput.value.trim();

        if (!email || !password) return showAuthToast("Please enter email and password.", "error");
        if (!isValidEmail(email)) return showAuthToast("Please enter a valid email address.", "error");
        
        if (isSignUp) {
            const passwordError = validateStrongPassword(password);
            if (passwordError) {
                if(passInput) passInput.focus();
                return showAuthToast(passwordError, "error");
            }
            const repass = repassInput.value.trim();
            if (password !== repass) {
                if(repassInput) repassInput.focus();
                return showAuthToast("Passwords do not match!", "error");
            }
        }

        // --- Loading State & A11y ---
        isProcessing = true;
        btnAuthAction.disabled = true;
        btnAuthAction.setAttribute('aria-busy', 'true');
        toggleInputsState(true);
        const originalText = btnAuthAction.textContent;
        btnAuthAction.textContent = 'Processing...';
        btnAuthAction.classList.add('opacity-50', 'cursor-not-allowed');

        try {
            await configurePersistence();

            if (isSignUp) {
                // --- SIGN UP FLOW ---
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await sendEmailVerification(userCredential.user);
                await syncUserProfile(userCredential.user, 'email');
                await signOut(auth); // Force logout until verified
                
                showAuthToast("Account created successfully! Please check your email to verify your account.", "success");
                if(btnToggleAuth) btnToggleAuth.click(); // Reset UI to login
                
            } else {
                // --- LOGIN FLOW ---
                checkRateLimit();
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                
                // Refresh user state to fetch latest email verification status
                await auth.currentUser.reload();

                if (!auth.currentUser.emailVerified) {
                    const now = Date.now();
                    const lastResend = lastVerificationResend[email] || 0;
                    
                    // Allow resend if 60 seconds have passed
                    if (now - lastResend > 60000) {
                        if (confirm("Your email is not verified. Would you like us to resend the verification link?")) {
                            await sendEmailVerification(auth.currentUser);
                            lastVerificationResend[email] = Date.now();
                            showAuthToast("Verification link sent! Please check your inbox.", "success");
                        } else {
                            showAuthToast("Please verify your email to access the application.", "error");
                        }
                    } else {
                        showAuthToast("Please verify your email. A link was recently sent to your inbox.", "error");
                    }
                    
                    await signOut(auth);
                    return; // Abort login flow
                }

                await syncUserProfile(userCredential.user, 'email');
                failedLoginAttempts = 0; 
                showAuthToast("Logged in successfully!", "success");
            }
        } catch (err) {
            logError(err, isSignUp ? 'Sign Up' : 'Login');
            if (!isSignUp) handleFailedLogin(err.code);
            
            const errorMsg = err.custom ? err.message : getFriendlyErrorMessage(err.code);
            showAuthToast(errorMsg, "error");
            
            // A11y: Restore focus for correction
            if (err.code && err.code.includes('password') && passInput) passInput.focus();
            else if (emailInput) emailInput.focus();
        } finally {
            isProcessing = false;
            btnAuthAction.disabled = false;
            btnAuthAction.removeAttribute('aria-busy');
            toggleInputsState(false);
            btnAuthAction.textContent = originalText;
            btnAuthAction.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    });
}

// Google Login Action
if(btnGoogleLogin) {
    btnGoogleLogin.addEventListener('click', async () => {
        if (isProcessing) return;
        if (isNetworkOffline()) return;

        isProcessing = true;
        btnGoogleLogin.disabled = true;
        btnGoogleLogin.setAttribute('aria-busy', 'true');
        btnGoogleLogin.classList.add('opacity-50', 'cursor-not-allowed');
        
        try {
            await configurePersistence();
            const userCredential = await signInWithPopup(auth, provider);
            
            // Google users are pre-verified inherently
            await syncUserProfile(userCredential.user, 'google');
            showAuthToast("Logged in with Google successfully!", "success");
        } catch (err) {
            if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
                logError(err, 'Google Login');
                showAuthToast(getFriendlyErrorMessage(err.code), "error");
            }
        } finally {
            isProcessing = false;
            btnGoogleLogin.disabled = false;
            btnGoogleLogin.removeAttribute('aria-busy');
            btnGoogleLogin.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    });
}

// Forgot Password Action
if(btnForgotPass) {
    btnForgotPass.addEventListener('click', async () => {
        if (isProcessing) return;
        if (isNetworkOffline()) return;

        const email = emailInput.value.trim();
        if (!email) {
            if(emailInput) emailInput.focus();
            return showAuthToast("Please enter your email first to reset password.", "error");
        }
        if (!isValidEmail(email)) return showAuthToast("Please enter a valid email address.", "error");
        
        isProcessing = true;
        btnForgotPass.disabled = true;
        btnForgotPass.setAttribute('aria-busy', 'true');
        toggleInputsState(true);
        btnForgotPass.classList.add('opacity-50', 'cursor-not-allowed');
        
        try {
            await sendPasswordResetEmail(auth, email);
            showAuthToast("Password reset email sent! Check your inbox.", "success");
        } catch (err) {
            logError(err, 'Forgot Password');
            showAuthToast(getFriendlyErrorMessage(err.code), "error");
        } finally {
            isProcessing = false;
            btnForgotPass.disabled = false;
            btnForgotPass.removeAttribute('aria-busy');
            toggleInputsState(false);
            btnForgotPass.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    });
}

// Logout Action
if(btnLogout) {
    btnLogout.addEventListener('click', async () => {
        if (isNetworkOffline()) return;

        if(confirm("Are you sure you want to securely logout?")) {
            try {
                if (typeof window.resetWorkspace === 'function') {
                    window.resetWorkspace();
                }
                await signOut(auth);
                showAuthToast("Logged out securely.", "success");
            } catch (err) {
                logError(err, 'Logout');
                showAuthToast("Error during logout.", "error");
            }
        }
    });
}

// --- Authentication State Observer ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Ensure UI is up to date with verification status
        await user.reload(); 
    }

    if (user && user.emailVerified) {
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
        
        if (isSignUp && btnToggleAuth) {
            btnToggleAuth.click(); // Reset to login view on sign-out
        }
    }
});
