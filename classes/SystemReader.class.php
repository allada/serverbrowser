<?php
require_once HELPERDIR . 'SystemReader.helper.php';
/**
* SystemRader class used to make it easier to work with the file system. Also auto checks to see
* if they are within the the restrictions of the config file.
*/
class SystemReader{
	/**
	* @var string [readonly] Current location of working object. (has trailing '/' if applicable)
	*/
	public $curLocation;
	/**
	* @var bool [readonly] If is file.
	*/
	public $is_file = false;
	/**
	* @var bool [readonly] If is symbolic link.
	*/
	public $is_symbolic = false;
	/**
	* @var string [readonly] Location of current symblic link if applicable.
	*/
	public $symbolic_location;
	/**
	* Creates an instance of this object. Use this function instead of constructing yourself.
	* Was done this way to keep these checks from happening on every construct but forces
	* non-trusted (external) calls to pass a few additional checks before construct, but allows
	* the real __construct() to not need to pass these checks if they are executed from within
	* class/object.
	* 
	* @param string $location Dir or file to construct object.
	* @return SystemReader
	*/
	public static function createReader($location){
		// This is done because realpath() resolves symbolic links and I did not want to do that.
		$realLocation = self::getRealPath(ROOTDIR.$location);
		if(substr($realLocation, 0, strlen(ROOTDIR)) != ROOTDIR){
			throw new Exception(CurLanguage::INVALID_DIR);
		}
		if(!file_exists($realLocation)){
			throw new Exception(sprintf(CurLanguage::FILE_NO_EXIST, $location));
		}
		return new SystemReader($location);
	}
	/**
	* @see createReader
	* @param mixed $location
	*/
	protected function __construct($location){
		$this->is_file = !is_dir(ROOTDIR . $location);
		 $this->curLocation = $location;
		if(!$this->is_file && substr($location, -1) != '/'){
			$this->curLocation .= '/';
		}		
		if(is_link(ROOTDIR . $location)){
			$this->is_symbolic = true;
			$this->symbolic_location = readlink(ROOTDIR . $location);
		}
	}
	/**
	* Gets the actual path of a directory or file without .. or . Works like realpath() but 
	* does not resolve symbolic links.
	* @param string $location Location to resolve
	* @return string Cleaned version of param1 ($location)
	*/
	public static function getRealPath($location){
		$location = str_replace('\\', '/', $location);
		$location = explode('/', $location);
		$realData = array();
		foreach($location as $i => $node){
			switch($node){
				case '':
				case '.':
					break;
				case '..':
					if(count($realData)){
						array_pop($realData);
					}
					break;
				default:
					$realData[] = $node;
			}
		}
		return '/' . implode('/', $realData);
	}
	/**
	* Obtain the data in a file if is file.
	* @return string
	*/
	public function getFileData(){
		if(!$this->is_file){
			throw new Exception(CurLanguage::NO_CONTENTS_ON_DIR);
		}
		return file_get_contents(ROOTDIR . $this->curLocation);
	}
	/**
	* Returns array of objects inside directory.
	* @return SystemReader[] Array of SystemReader objects.
	*/
	public function getDirContents(){
		if($this->is_file){
			throw new Exception(CurLanguage::MUST_BE_DIRECTORY);
		}
		if(!is_readable(ROOTDIR . $this->curLocation)){
			throw new Exception(CurLanguage::PERMISSION_DENIED);
		}
		$dir = dir(ROOTDIR . $this->curLocation);
		$nodes = array();
		while(($node = $dir->read()) !== false){
			if($node == '.' || $node == '..'){
				continue;
			}
			$nodes[$node] = new SystemReader($this->curLocation . $node);
		}
		return $nodes;
	}
}