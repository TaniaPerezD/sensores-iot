import { getJson, postJson } from "./http";

const loginUser = async ({ email, password }) => {
  return postJson(
    "/api/auth/login",
    { email, password },
    { useAuth: false }
  );
};

const registerUser = async ({ full_name, email, password, role = "admin" }) => {
  return postJson(
    "/api/auth/register",
    { full_name, email, password, role },
    { useAuth: false }
  );
};

const getMe = async () => {
  return getJson("/api/auth/me");
};

const getUsers = async () => {
  return getJson("/api/users");
};

export {
  loginUser,
  registerUser,
  getMe,
  getUsers,
};