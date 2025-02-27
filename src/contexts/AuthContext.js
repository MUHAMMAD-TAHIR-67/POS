import { auth, firestore } from 'config/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import React, { createContext, useCallback, useContext, useEffect, useReducer, useState } from 'react'

const Auth = createContext()

const initialState = { isAuthenticated: false, user: {} }

const reducer = (state, { type, payload }) => {
    switch (type) {
        case "SET_LOGGED_IN":
            return { isAuthenticated: true, user: payload.user }
        case "SET_PROFILE":
            return { ...state, user: payload.user }
        case "SET_LOGGED_OUT":
            return initialState
        default: return state
    }
}

export default function AuthContext({ children }) {

    const [state, dispatch] = useReducer(reducer, initialState)
    const [isAppLoading, setIsAppLoading] = useState(true)

    const readProfile = useCallback(() => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                const docSnap = await getDoc(doc(firestore, "users", user.uid));

                if (docSnap.exists()) {
                    const user = docSnap.data()
                    dispatch({ type: "SET_LOGGED_IN", payload: { user } })
                } else {
                    console.log("User profile data not found!");
                }
                setIsAppLoading(false)
            } else {
                setIsAppLoading(false)
            }
        })
    }, [])
    useEffect(() => { readProfile() }, [readProfile])

    const handleLogout = () => {
        dispatch({ type: "SET_LOGGED_OUT" })

        signOut(auth)
            .then(() => {
                window.toastify("Logout successful", "success")
            })
            .catch(err => {
                console.error(err)
                window.toastify("Something went wrong while signing out", "error")
            })
    }

    return (
        <Auth.Provider value={{ ...state, dispatch, isAppLoading, setIsAppLoading, handleLogout }}>
            {children}
        </Auth.Provider>
    )
}

export const useAuthContext = () => useContext(Auth)