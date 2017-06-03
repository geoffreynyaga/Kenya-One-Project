<?php 

$name = "Takunda";
$Age = 56;
$sex = "Male";

$Mydetails = array();
$Mydetails["name"] = $name;
$Mydetails["age"] = $age;
$Mydetails["sex"] = $sex;

print_r($Mydetails);

$Mydetails = array("name"=> $name
					"age"=>$Age
					"sex"=>$sex);

echo json_encode($Mydetails);

