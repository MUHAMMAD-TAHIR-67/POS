import React, { useState } from "react";
import { Button, Col, Form, Input, Row, Typography } from "antd";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { auth, firestore } from "config/firebase";

const { Title } = Typography;

const initialState = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function Register() {
  const [state, setState] = useState(initialState);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleChange = (e) =>
    setState((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    let { fullName, email, password, confirmPassword } = state;

    fullName = fullName.trim();

    if (fullName.length < 3) {
      return window.toastify("Please enter your full name", "error");
    }
    if (!window.isEmail(email)) {
      return window.toastify("Please enter a valid email address", "error");
    }
    if (password.length < 6) {
      return window.toastify("Password must be at least 6 characters.", "error");
    }
    if (confirmPassword !== password) {
      return window.toastify("Passwords do not match", "error");
    }

    setIsProcessing(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await createUserProfile({ ...user, fullName });
    } catch (error) {
      console.error("Error:", error);
      switch (error.code) {
        case "auth/email-already-in-use":
          window.toastify("Email address already in use", "error");
          break;
        default:
          window.toastify(
            "Something went wrong while creating a new user",
            "error"
          );
          break;
      }
      setIsProcessing(false);
    }
  };

  const createUserProfile = async (user) => {
    const { fullName, email, uid } = user;
    const userData = {
      fullName,
      email,
      uid,
      dateCreated: serverTimestamp(),
      emailVerified: false,
      status: "active",
      roles: ["superAdmin"],
    };
    try {
      await setDoc(doc(firestore, "users", userData.uid), userData);
      window.toastify("A new user has been successfully registered", "success");
      setState(initialState); // Reset form after successful registration
    } catch (e) {
      console.error("Error adding document: ", e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Row justify="center" style={{ marginTop: "50px" }}>
      <Col span={12}>
        <Title level={3} style={{ textAlign: "center" }}>
          Register
        </Title>
        <Form layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Full Name" required>
            <Input
              name="fullName"
              value={state.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
            />
          </Form.Item>
          <Form.Item label="Email" required>
            <Input
              name="email"
              value={state.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />
          </Form.Item>
          <Form.Item label="Password" required>
            <Input.Password
              name="password"
              value={state.password}
              onChange={handleChange}
              placeholder="Enter your password"
            />
          </Form.Item>
          <Form.Item label="Confirm Password" required>
            <Input.Password
              name="confirmPassword"
              value={state.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={isProcessing}
            >
              Register
            </Button>
          </Form.Item>
        </Form>
      </Col>
    </Row>
  );
}
