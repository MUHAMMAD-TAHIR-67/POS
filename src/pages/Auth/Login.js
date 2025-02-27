import React, { useState } from 'react'
import { Button, Col, Form, Input, Row, Typography } from 'antd'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from 'config/firebase'
import { useAuthContext } from 'contexts/AuthContext'

const { Title } = Typography

const initialState = { email: "", password: "" }

export default function Login() {

    const { dispatch } = useAuthContext()

    const [state, setState] = useState(initialState)
    const [isProcessing, setIsProcessing] = useState(false)

    const handleChange = e => setState(s => ({ ...s, [e.target.name]: e.target.value }))

    const handleSubmit = e => {
        e.preventDefault();

        let { email, password } = state

        if (!window.isEmail(email)) { return window.toastify("Please enter a valid email address", "error") }
        if (password.length < 6) { return window.toastify("Password must be atleast 6 chars.", "error") }

        setIsProcessing(true)

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log("user", user)
                window.toastify("Login successful", "success")
                // dispatch({ type: "SET_LOGGED_IN", payload: { user } })
            })
            .catch((error) => {
                console.error("error", error)
                switch (error.code) {
                    case "auth/invalid-credential":
                        window.toastify("Invalid email or password", "error"); break;
                    default: window.toastify("Something went wrong while login", "error"); break;
                }
            })
            .finally(() => {
                setIsProcessing(false)
            })

    }

    return (
        <main className='auth'>
            <div className="card p-3 p-md-4 w-100">
                <Title level={2} className='text-center'>Login</Title>

                <Form layout="vertical">
                    <Row gutter={[16, 16]}>
                        <Col span={24}>
                            <Input size='large' type='email' placeholder='Enter your email' name="email" value={state.email} onChange={handleChange} />
                        </Col>
                        <Col span={24}>
                            <Input.Password size='large' placeholder='Enter your password' name="password" value={state.password} onChange={handleChange} />
                        </Col>
                        <Col span={24}>
                            <Button type='primary' size='large' block htmlType='submit' loading={isProcessing} onClick={handleSubmit}>Login</Button>
                        </Col>
                    </Row>
                </Form>
            </div>
        </main>
    )
}
