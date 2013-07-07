<?php
/**
* Helper class used in conj with SystemReader class. This outputs the data, in other
* words it's the "view".
*/
class SystemReader__Helper{
	/**
	* Returns or outputs json data based on SystemReader
	* 
	* @param SystemReader $reader Reader to build json for.
	* @param bool $return Return array of json-ready data or output json encoded data.
	* @return array|bool Json-ready array if $return param is true sends json-encoded
	* string to stdout and returns true.
	*/
	public static function out(SystemReader $reader, $return = false){
		$json = array(
			'loc' => $reader->curLocation,
			'linkLoc' => $reader->symbolic_location,
			'isFile' => $reader->is_file,
			'data' => null,
			'nodes' => null,
		);
		if($reader->is_file){
			$json['data'] = $reader->getFileData();
		}else{
			$json['nodes'] = array();
			foreach($reader->getDirContents() as $name => $node){
				$json['nodes'][] = array(
					'name' => $name,
					'loc' => $node->curLocation,
					'linkLoc' => $node->symbolic_location,
					'isFile' => $node->is_file,
					'data' => null,
					'nodes' => null
				);
			}
		}
		if($return){
			return $json;
		}
		echo json_encode($json);
		return true;
	}
}