<?php
require_once '../config.php';
require_once LANGDIR . LANGUAGE . '.lang.php';
require_once CLASSDIR . 'SystemReader.class.php';
// Sleeps to simulate a .5 to 1 second lag from high load.
usleep(500000 + rand(0, 5)* 100000);
try{
	$reader = SystemReader::createReader($_GET['node']);
	header('Content-Type: application/json');
	SystemReader__Helper::out($reader);
}catch(Exception $e){
	header('Content-Type: application/json');
	echo json_encode(array(
		'error' => $e->getMessage()
	));
}