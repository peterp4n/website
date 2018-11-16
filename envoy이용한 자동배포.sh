0. ssh auto login and aws credentials 
$ aws configure
AWS Access Key ID [None]: Access ID
AWS Secret Access Key [None]: Access Key
Default region name [None]: ap-northeast-2
Default output format [None]: json

1. 설치
$ composer global require laravel/envoy

2. path 설정
export PATH=~/.composer/vendor/bin:$PATH

3. Envoy.blade.php 작성
@servers(['web1' => ' -A -i ~/.ssh/id.pub ec2-user@서버아이피1', 'web2' => ' -A -i ~/.ssh/id.pub ec2-user@서버아이피2'])
 
@task('작업명', ['on' => ['web1','web2']])
    cd 웹루트
    git pull origin
@endtask
  
4. 배포
$ envoy run 작업명

