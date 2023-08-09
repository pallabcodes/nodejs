# One to One

One Employee has One Details

## [ Employee Table ]

| Employee_Id | firstName | lastName | salary |
| ----------- | --------- | -------- | ------ |
| 1           | Son       | Gohan    | 121212 |
| 2           | Son       | Goten    | 111111 |

## [ EmployeeDetails Table ]

| Id  | mobile      | passportNo | employeeId |
| --- | ----------- | ---------- | ---------- |
| 1   | 1212 120201 | SDFG1212S  | 1          |
| 2   | 1010 201011 | SZFQ1212J  | 2          |

# One To Many : Many To One

One User has Many Address(es)
Many Address (es) has One User

| Employee_Id | firstName | lastName | salary |
| ----------- | --------- | -------- | ------ |
| 1           | Son       | Gohan    | 121212 |
| 2           | Son       | Goten    | 111111 |

| id  | address    | isRemote            | EmployeeId |
| --- | --------   | -----------------   | ---------- |
| 1   | London     | true                | 1          |
| 2   | Manchester | null                | 1          |

# Many To Many

One Employee Has Many Skill (s)
One Skill belong to Many Employee (s)
One EmployeeSkills has One Employee and One Skill

## Employee Table

| Employee_Id | firstName | lastName | salary |
| ----------- | --------- | -------- | ------ |
| 1           | Son       | Gohan    | 121212 |
| 2           | Son       | Goten    | 111111 |

## Skill Table

| Skill_Id | desc                 |
| -------- | -------------------- |
| 1        | JavaScript developer |
| 2        | Android developer    |

## EmployeeSkills: This is a `Junction table`

| Id  | Employee_Id | Skill_Id |
| --- | ----------- | -------- |
| 1   | 1           | 1        |
| 2   | 1           | 2        |
