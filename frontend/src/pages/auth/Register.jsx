import { useState } from "react";
import api from "../../services/api"; // adjust path according to your folder

export default function Register() {

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });


  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

  };


  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      const response = await api.post(
        "/auth/register",
        formData
      );


      alert("Registration successful");

      console.log(response.data);


    } catch (error) {

      console.log(error);

      alert(
        error.response?.data?.message || 
        "Server error"
      );

    }

  };


  return (

    <div className="p-10 flex justify-center">

      <form
        onSubmit={handleSubmit}
        className="w-96 shadow-lg p-6 rounded"
      >

        <h1 className="text-3xl font-bold mb-6">
          Register Gym
        </h1>


        <input

          type="email"
          name="email"
          placeholder="email"

          value={formData.email}

          onChange={handleChange}

          className="border p-3 w-full mb-4"

        />


        <input

          type="password"
          name="password"
          placeholder="Password"

          value={formData.password}

          onChange={handleChange}

          className="border p-3 w-full mb-4"

        />


        <button

          type="submit"

          className="bg-blue-600 text-white p-3 w-full rounded"

        >

          Register

        </button>


      </form>

    </div>

  );
}