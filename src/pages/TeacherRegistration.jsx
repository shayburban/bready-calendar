import React from "react";
import { TeacherProvider } from "../components/teacher-registration/TeacherContext";
import TeacherForm from "../components/teacher-registration/TeacherForm";
import { ServiceProvider } from "../components/teacher-registration/ServiceContext";

const TeacherRegistration = () => {
  return (
    <>
      <TeacherProvider>
        <ServiceProvider>
          <TeacherForm />
        </ServiceProvider>
      </TeacherProvider>
    </>
  );
};

export default TeacherRegistration;