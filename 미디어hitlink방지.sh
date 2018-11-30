이미지 링크 무단 복사 방지 – .htaccess 사용

이런 경우 .htaccess를 통해 이미지가 외부 사이트에서 로드되지 않도록 설정할 수 있습니다. 기본적인 코드는 다음과 같습니다.

RewriteEngine on
RewriteCond %{HTTP_REFERER} !^$
RewriteCond %{HTTP_REFERER} !^http(s)?://(www\.)?yourdomain.com [NC]
RewriteCond %{HTTP_REFERER} !^http(s)?://(www\.)?yourdomain2.com [NC]
RewriteRule \.(jpg|jpeg|png|gif)$ http://hpmouse.googlepages.com/hotlink.gif [NC,R,L]
