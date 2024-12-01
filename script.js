// Global Data Arrays
const courses = [];
const students = [];

// Utility Functions
const calculateGrade = (midterm, final, scale) => {
    const total = midterm * 0.4 + final * 0.6;

    if (scale === "1") {
        // 10-point scale
        if (total >= 90) return "A";
        if (total >= 80) return "B";
        if (total >= 70) return "C";
        if (total >= 60) return "D";
        return "F";
    } else if (scale === "2") {
        // 7-point scale
        if (total >= 93) return "A";
        if (total >= 85) return "B";
        if (total >= 77) return "C";
        if (total >= 70) return "D";
        return "F";
    } else {
        return "Invalid scale";
    }
};


const calculateGPA = (grades) => {
    const gradePoints = { A: 4.0, B: 3.0, C: 2.0, D: 1.0, F: 0.0 };
    const totalPoints = grades.reduce((acc, grade) => acc + gradePoints[grade], 0);
    return (totalPoints / grades.length).toFixed(2);
};

const updateDropdown = (dropdown, items, labelKey = "name") => {
    dropdown.innerHTML = '<option value="">Select</option>';
    items.forEach((item) => {
        const option = document.createElement("option");
        option.value = item[labelKey];
        option.textContent = item[labelKey];
        dropdown.appendChild(option);
    });
};

// Add Course
document.getElementById("course-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const courseName = document.getElementById("course-name").value.trim();
    const gradingScale = document.getElementById("grading-scale").value;

    if (!courseName) return alert("Course name is required.");
    if (courses.find((c) => c.name === courseName)) return alert("Course already exists.");

    courses.push({ name: courseName, scale: gradingScale, students: [] });
    updateDropdown(document.getElementById("course-select"), courses);
    updateDropdown(document.getElementById("assign-course"), courses);
    updateDropdown(document.getElementById("lecture-dropdown"), courses);
    alert(`Course "${courseName}" added successfully!`);
    e.target.reset();
});

// Add Student
document.getElementById("student-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const studentId = document.getElementById("student-id").value.trim();
    const studentName = document.getElementById("student-name").value.trim();
    const studentSurname = document.getElementById("student-surname").value.trim();

    if (!studentId || !studentName || !studentSurname) return alert("All fields are required.");
    if (students.find((s) => s.id === studentId)) return alert("Student with this ID already exists.");

    students.push({ id: studentId, name: studentName, surname: studentSurname, courses: [] });
    updateDropdown(document.getElementById("assign-student"), students, "name");
    alert(`Student "${studentName} ${studentSurname}" added successfully!`);
    e.target.reset();
});

// Assign Scores
document.getElementById("score-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const studentName = document.getElementById("assign-student").value;
    const courseName = document.getElementById("assign-course").value;
    const midterm = parseFloat(document.getElementById("midterm-score").value);
    const final = parseFloat(document.getElementById("final-score").value);

    if (!studentName || !courseName) return alert("Student and course must be selected.");
    if (isNaN(midterm) || isNaN(final) || midterm < 0 || midterm > 100 || final < 0 || final > 100) {
        return alert("Scores must be between 0 and 100.");
    }

    const student = students.find((s) => s.name === studentName);
    const course = courses.find((c) => c.name === courseName);

    if (student.courses.find((c) => c.name === course.name)) {
        return alert(`"${student.name}" is already assigned to "${course.name}".`);
    }

    const grade = calculateGrade(midterm, final, course.scale);

    student.courses.push({ name: course.name, midterm, final, grade });
    course.students.push({ id: student.id, name: student.name, surname: student.surname, midterm, final, grade });

    alert(`Scores assigned to "${student.name}" for "${course.name}".`);
    updateResultsTable();
    updateLectureStatistics();
    e.target.reset();
});

// Update Results Table
const updateResultsTable = (filter = null, courseFilter = null, searchQuery = null) => {
    const tbody = document.getElementById("results-table").querySelector("tbody");
    tbody.innerHTML = ""; // Clear table contents

    students.forEach((student) => {
        student.courses.forEach((course) => {
            // Apply filters
            if (courseFilter && course.name.trim().toLowerCase() !== courseFilter.trim().toLowerCase()) return;
            if (filter === "passed" && course.grade === "F") return;
            if (filter === "failed" && course.grade !== "F") return;
            if (searchQuery && 
                !student.name.toLowerCase().includes(searchQuery) && 
                !student.surname.toLowerCase().includes(searchQuery) && 
                !student.id.includes(searchQuery) && 
                !`${student.name} ${student.surname}`.toLowerCase().includes(searchQuery)
            ) return;

            // Add row to table
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td>${student.surname}</td>
                <td>${course.name}</td>
                <td>${course.midterm}</td>
                <td>${course.final}</td>
                <td>${course.grade}</td>
                <td>${calculateGPA(student.courses.map((c) => c.grade))}</td>
                <td>
                    <button onclick="deleteCourseFromStudent('${student.id}', '${course.name}')">Remove</button>
                    <button onclick="openModal('${student.id}', '${course.name}')">Update</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    });
};

// Delete Course from Student
const deleteCourseFromStudent = (studentId, courseName) => {
    const student = students.find((s) => s.id === studentId);
    const course = courses.find((c) => c.name === courseName);

    if (!student || !course) {
        alert("Error: Student or course not found.");
        return;
    }

    student.courses = student.courses.filter((c) => c.name !== courseName);
    course.students = course.students.filter((s) => s.id !== studentId);

    alert(`Removed "${courseName}" from student "${student.name} ${student.surname}".`);
    const currentCourse = document.getElementById("course-select").value; // Keep the current filter
    updateResultsTable(null, currentCourse);
    updateLectureStatistics();
};

// Modal Functions for Update
let selectedStudentId = null;
let selectedCourseName = null;

const openModal = (studentId, courseName) => {
    selectedStudentId = studentId;
    selectedCourseName = courseName;

    const student = students.find((s) => s.id === studentId);
    const course = student.courses.find((c) => c.name === courseName);

    document.getElementById("update-name").value = student.name;
    document.getElementById("update-surname").value = student.surname;
    document.getElementById("update-midterm").value = course.midterm;
    document.getElementById("update-final").value = course.final;

    document.getElementById("update-modal").style.display = "block";
};

const closeModal = () => {
    document.getElementById("update-modal").style.display = "none";
};

// Update Student Information
document.getElementById("update-form").addEventListener("submit", (e) => {
    e.preventDefault();

    const newName = document.getElementById("update-name").value.trim();
    const newSurname = document.getElementById("update-surname").value.trim();
    const newMidterm = parseFloat(document.getElementById("update-midterm").value);
    const newFinal = parseFloat(document.getElementById("update-final").value);

    if (!newName || !newSurname || isNaN(newMidterm) || isNaN(newFinal)) {
        return alert("All fields are required and scores must be valid numbers.");
    }

    const student = students.find((s) => s.id === selectedStudentId);
    const course = student.courses.find((c) => c.name === selectedCourseName);

    student.name = newName;
    student.surname = newSurname;
    course.midterm = newMidterm;
    course.final = newFinal;
    course.grade = calculateGrade(newMidterm, newFinal, courses.find((c) => c.name === course.name).scale);

    const courseRecord = courses.find((c) => c.name === selectedCourseName);
    const studentInCourse = courseRecord.students.find((s) => s.id === student.id);
    studentInCourse.midterm = newMidterm;
    studentInCourse.final = newFinal;
    studentInCourse.grade = course.grade;

    alert("Student information updated successfully.");
    closeModal();
    const currentCourse = document.getElementById("course-select").value; // Keep the current filter
    updateResultsTable(null, currentCourse);
    updateLectureStatistics();
});

// Update Lecture Statistics
const updateLectureStatistics = () => {
    const selectedCourseName = document.getElementById("lecture-dropdown").value;
    if (!selectedCourseName) {
        document.getElementById("passed-count").textContent = "0";
        document.getElementById("failed-count").textContent = "0";
        document.getElementById("mean-score").textContent = "0";
        return;
    }

    const course = courses.find((c) => c.name === selectedCourseName);

    if (!course || course.students.length === 0) {
        document.getElementById("passed-count").textContent = "0";
        document.getElementById("failed-count").textContent = "0";
        document.getElementById("mean-score").textContent = "0";
        return;
    }

    const passedStudents = course.students.filter((s) => s.grade !== "F").length;
    const failedStudents = course.students.filter((s) => s.grade === "F").length;

    const meanScore =
        course.students.reduce((acc, student) => acc + (student.midterm * 0.4 + student.final * 0.6), 0) /
        course.students.length;

    document.getElementById("passed-count").textContent = passedStudents;
    document.getElementById("failed-count").textContent = failedStudents;
    document.getElementById("mean-score").textContent = meanScore.toFixed(2) || "0";
};

document.getElementById("lecture-dropdown").addEventListener("change", updateLectureStatistics);

// Search and Filters
document.getElementById("course-select").addEventListener("change", (e) => {
    const selectedCourse = e.target.value;
    updateResultsTable(null, selectedCourse);
});

document.getElementById("search-student").addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const currentCourse = document.getElementById("course-select").value; // Keep the current course filter
    updateResultsTable(null, currentCourse, query);
});

document.getElementById("view-all").addEventListener("click", () => {
    const currentCourse = document.getElementById("course-select").value; // Keep the current course filter
    updateResultsTable(null, currentCourse);
});

document.getElementById("filter-passed").addEventListener("click", () => {
    const currentCourse = document.getElementById("course-select").value; // Keep the current course filter
    updateResultsTable("passed", currentCourse);
});

document.getElementById("filter-failed").addEventListener("click", () => {
    const currentCourse = document.getElementById("course-select").value; // Keep the current course filter
    updateResultsTable("failed", currentCourse);
});

// Existing script content remains the same as in the original script.js

// Add sidebar navigation functionality
document.addEventListener('DOMContentLoaded', () => {
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    const contentSections = document.querySelectorAll('.content-section');

    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all items and sections
            sidebarItems.forEach(i => i.classList.remove('active'));
            contentSections.forEach(section => section.classList.remove('active'));

            // Add active class to clicked item and corresponding section
            item.classList.add('active');
            const targetSectionId = item.getAttribute('data-target');
            document.getElementById(targetSectionId).classList.add('active');
        });
    });
});