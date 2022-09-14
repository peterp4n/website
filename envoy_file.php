<?php
	$cmd = "aws ec2 describe-instances --filter Name=tag:aws:autoscaling:groupName,Values=web-ASG ";
	$res = shell_exec($cmd);
	$result = json_decode($res, true);
	$ec_list = isset($result['Reservations']) ? $result['Reservations'] : [];

	$ec2_list = [];
	foreach($ec_list as $key => $val) {
		$ec2 = $val['Instances'];
		foreach($ec2 as $k => $v) {
			$status = $v['State'];
			if(isset($v['PrivateIpAddress']) && $status['Code']==16) {
				$ec2_list[] = $v['PrivateIpAddress'];
			}
		}
	}
?>
@servers(['dev' => ' -A localhost', 'web0' => ' -A 10.10.10.01', 'web01'=> ' -A 10.10.10.02', 'web02'=> ' -A 10.10.10.03'])

@task('server_info', ['on' => ['dev']])
	@foreach ($ec2_list as $ec2)
	  echo "server : {{$ec2}}   "
	@endforeach
@endtask


@task('web_master', ['on' => ['web0', 'web01', 'web02']])
    git -C /web/www pull origin master
@endtask


<?php
$repository = 'https://git-codecommit.ap-northeast-2.amazonaws.com/v1/repos/website';
$branch = "master";
$web_dir = '/web/www';
$data_dir = '/web/data/www';
?>

@task('riroschool_set_branch', ['on' => ['web0', 'web01', 'web02']])
	cd {{$web_dir}};
	pwd;
	rm -rf www;
	git clone -b {{$branch}} --single-branch {{$repository}} www;
	cd www;
	pwd;
	ln -s {{$data_dir}}/board_files .;
@endtask


@setup
  // 서버 정보
  $username = 'your_username';
  $usergroup = 'your_usergroup';
 
  // 프로젝트 정보
  $base_dir = "/home/{$username}/www"; // 배포를 진행할 최상위 루트 경로
  $project_root = "{$base_dir}/your_project_name"; // 프로젝트 루트 경로
  $shared_dir = "{$base_dir}/shared"; // 공용 파일의 경로
  $release_dir = "{$base_dir}/releases"; // 배포된 디렉토리들의 부모 경로
  $distname = 'release_' . date('YmdHis'); // 현재 시점의 배포 디렉토리 명
 
  // 배포를 위해서 반드시 필요한 디렉토리들
  $required_dirs = [
    $shared_dir,
    $release_dir,
  ];
 
  // 공유 파일, 또는 디렉토리 들
  $shared_items = [
    "{$shared_dir}/.env" => "{$release_dir}/{$distname}/.env",
    "{$shared_dir}/storage" => "{$release_dir}/{$distname}/storage",
    "{$shared_dir}/cache" => "{$release_dir}/{$distname}/bootstrap/cache",
    "{$shared_dir}/files" => "{$release_dir}/{$distname}/public/files",
  ];
@endsetup
 
@task('riroschool_make_school', ['on' => ['web0', 'web01', 'web02']])
  echo "=============== 1. 배포 준비 (디렉토리 생성 등)..."
  @foreach ($required_dirs as $dir)
    [ ! -d ] && mkdir -p ;
  @endforeach
 
  @foreach($shared_items as $global => $local)
    [ -f ] && rm ;
    [ -d ] && rm -rf ;
    ln -nfs ;
  @endforeach
 
  echo "=============== 2. 소스코드 복제(clone)..."
  cd && git clone -b ;
 
  echo "=============== 3. 공용(shared) 리소스 연결 (.env, storage 등)..."
  [ ! -f /.env ] && cp //.env.example /.env;
  [ ! -d /storage ] && cp -R //storage ;
  [ ! -d /cache ] && cp -R //bootstrap/cache ;
  [ ! -d /files ] && cp -R //public/files ;
 
  chmod -R 777 /storage;
  chgrp -h -R /;
 
  echo "=============== 4. 의존성 설치 (composer, node packages)..."
  cd / && composer install --prefer-dist --no-scripts --no-dev;
  cd / && npm install;
 
  echo "=============== 7. 프로젝트 루트 디렉토리 심볼릭 링크 변경..."
  ln -nfs / ;
 
  echo "=============== 8. 웹 서버, php fpm(FastCGI Process Manager) 재실행 ..."
  sudo systemctr restart httpd
@endtask
