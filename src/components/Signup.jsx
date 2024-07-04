import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addUser } from "../redux/onboardingSlice";
import { useNavigate } from "react-router-dom";
import Joi from "joi";
import { validate } from "./onboarding/validation/validate";
import { nanoid } from "nanoid";
import { signupSchema } from "./onboarding/validation/schemas";
import { generateId } from "./onboarding/utils";

const Signup = () => {
  const [formData, setFormData] = useState({});
  const onInput = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };
  // console.log(formData);

  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const redirect = useNavigate();

  //======Validates credentials============
  const onSubmit = async (e) => {
    const errObj = await validate(formData, "signup");
    if (errObj.password1 || errObj.email) {
      console.log(errObj);
    } else {
      if (formData.password1 === formData.password2) {
        formData.userID = generateId("user");
        dispatch(addUser(formData));
        localStorage.setItem("user", JSON.stringify(formData));
        console.log(formData);
        redirect("/login");
      } else {
        console.log("passwords don't match", formData);
      }
    }
  };

  return (
    <div onInput={onInput}>
      <input type="email" name="email" id="email" placeholder="email" />
      <input
        type="password"
        name="password"
        id="password1"
        placeholder="new password"
      />

      <input
        type="password"
        name="password"
        id="password2"
        placeholder="confirm password"
      />
      <button onClick={onSubmit}>Sign Up</button>
    </div>
  );
};

export default Signup;
