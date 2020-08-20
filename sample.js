'use strict';

/***********************************************
 * 전역변수
 ***********************************************
 */

var DATA = {};
var checkUnload = true;

/***********************************************
 * 화면 메인(ready) 함수
 ***********************************************
 */
$(document).ready(function(){
	
	// 세션 정보 로드
	Com.loadSession();
	// 초기데이터 로드
	MainEvent.loadData();
	// UI화면 준비
    MainEvent.prepareUI();

});

/***********************************************
 * 메인 이벤트
 ***********************************************
 */
var MainEvent = {
    
	// 초기 데이터 로드
	loadData : function() {
		DATA.quizId = $("#quizId").val();
		Quiz.init(); // 퀴즈 초기화
	},
	
	// UI화면 준비
	prepareUI : function(){
		
		// ButtonEvent 객체 버튼 이벤트 주입 
		Com.injectButtonEvent(ButtonEvent);
		
		// 폼 전송
		$("#createQuizForm").validate({
			 errorPlacement : function(error, element) {

				if (element.hasClass('objectiveItem')) {
					error.insertAfter(element.next());
				} else if(element.hasClass('objectiveItemCheck')){
					$(error).addClass("objectiveItemCheck-error");
					error.insertBefore(element.closest('.answers').prepend());
				} else {
					error.insertAfter(element);
				}
			},
			rules : {
				"subject" : {
					required : true,
					maxlength : 500,
				},
				"itemSubject" : {
					required : true,
					maxlength : 1000,
				},
			},
			
			submitHandler: function(form) {
				return false;
			}
		});
		
		
		
		
		if(Com.isNotNull(DATA.quizId)){
			
			//퀴즈 수정 데이터를 불러온다. 
			Ajax({
				url: "/rest/quiz/"+DATA.quizId, 
				method : "get",
				async : false,
				success: function (resData) {
					Com.setForm($("#createQuizForm"),resData.data.quizData);
					Quiz.viewDataList(resData.data.questionList);
					
					calc();
				}
			});	
		}
		
		/**
		 * 페이지 이동 시 내용 저장 안된다고 알림
		 * @author 김지상
		 */
		$(window).on("beforeunload", function(){
			if(checkUnload) return $.i18n.prop("i.modifications.will.not.saved");
		});
	},
	
};

/*******************************************************************************
 * 버튼 이벤트 **********************************************
 */
var ButtonEvent = {
	objectiveAdd : {
		click : function(event,This){
			Quiz.addObjectiveQuiz();
		},
	},
	subjectiveAdd : {
		click : function(event,This){
			Quiz.addSubjectiveQuiz();
		},
	},
	quizClose : {
		click : function(event,This){
				var formData = {
					quizFolderId : $('#quizFolderId').val(),
					folderSubject : $("#folderSubject").val(),
				}
				Com.formGetSubmit(Com.getCompanyUrl('/main/quiz/listPage'), formData);
		},
	},
	quizSubmit : {
		click : function(event,This){
			var noObjectiveItem = false;
			checkUnload = false;
			$.each($("#quizContent").find('.quizSet'), function(index, questionItem){
				
				/**
				 * 보기 , 문제, checkbox validation 추가
				 * @author 이유수
				 */
				
				//객관식
				if($(questionItem).find(".subjectiveItem").length == 0){
					$.each($(questionItem).find(".objectiveItem"), function(index, items){
						$(this).rules('add', {
							required : true,
							maxlength : 1000,
						});
						
						if(items.length == 0){
							noObjectiveItem = true;
						}
					});
				}
				//주관식
				else{
					$.each($(questionItem).find(".subjectiveItem"), function(index, items){
						$(this).rules('add', {
							required : true,
							maxlength : 1000,
						});
					});
				}
				
				//객관식 & 주관식 문제 필드
				$.each($(questionItem).find(".itemSubject"), function(index, items){
					$(this).rules('add', {
						required : true,
						maxlength : 1000,
						
					});
				});
				
				//객관식 & 주관식 문제 배점
				$.each($(questionItem).find(".itemPoint"), function(index, items){
					$(this).rules('add', {
						required : true,
						number: true,
					});
				});
				
				// 객관식 보기 체크 박스
				$.each($(questionItem).find(":checkbox"), function(index, items){
					$(this).rules('add', {
						required : true,
						messages: {
			                required: $.i18n.prop("i.select.answer")
			            }
					});
				});
				
				
				
			});
			
			if($("#createQuizForm").valid() && !noObjectiveItem){
				console.log("success valid");
				
				var method = Com.isNull(DATA.quizId) ? "post" : "put";
	        	// Quiz 정보
				var quizData = {
						quizTypeCd : $("#quizTypeCd").val(), //퀴즈 타입
						quizFolderId : $("#quizFolderId").val(),
						subject : $('input[name="subject"]').val(), //제목
						limittime : $('select[name="limittime"]').val(), //제한 시간
						publicYn : $('input[name="publicYn"]:checked').val(), // 공개 여부
						etc : $('textarea[name="etc"]').val(), // 전달 사항
				};
				if(Com.isNotNull(DATA.quizId)){
					quizData['quizId'] = DATA.quizId;
				}
				// 문제 - 보기
				var questionList = [];
				
				//퀴즈 문제 리스트
				$.each($("#quizContent").find('.quizSet'), function(index, questionItem){
					var question = {};
					var itemCnt = 1;
					
					//객관식 정답
					var objectiveAnswer = "";
					//주관식 정답
					var subjectiveAnswer = "";
					
					//주관식 존재 여부
					question['subjectiveYn'] = "N";
					
					//객관식
					if($(questionItem).find(".subjectiveItem").length == 0){
						$.each($(questionItem).find(".objectiveItem"), function(index, items){
							question['item'+(index+1)] = items.value;
			    		});
						itemCnt = $(questionItem).find(".objectiveItem").length;
						
						//객관식 정답(구분자 |로 복수 정답 저장)
						$.each($(questionItem).find(".objectiveItemCheck"), function(index, items){
							if(this.checked){
								objectiveAnswer += (index+1)+"|";
							}
			    		});
						
						question['objectiveAnswer'] = objectiveAnswer.substr(0, objectiveAnswer.length -1);

					}
					//주관식
					else{
						question['subjectiveAnswer'] =$(questionItem).find(".subjectiveItem").val();
						question['subjectiveYn'] = "Y";
						itemCnt = $(questionItem).find(".subjectiveItem").length;
					}
					
					//문제 제목
					question['subject'] = $(questionItem).find(".itemSubject").val();
					//문제 배점
					question['point'] = $(questionItem).find(".itemPoint").val();
					//보기 개수
					question['itemCnt'] = itemCnt;
					
					if(Com.isNotNull(DATA.quizId)){
						question['quizId'] = DATA.quizId;
					}
					
					questionList.push(question);
					
	    		});
				
	        	var data =
	        	{
					quizData : quizData,
					questionList : questionList
	    		};
	        	
	        	// 등록 & 수정
	        	Ajax({
	    			url: "/rest/quiz/save", 
	    			method : method,
	    			data : JSON.stringify(data),
	    			showMsg: true,
	    			async : true,
	    			success: function(resBody){ 
	    				var formData = {
	    					quizFolderId : $('#quizFolderId').val(),
	    					folderSubject : $("#folderSubject").val(),
	    				}
	    				Com.formGetSubmit(Com.getCompanyUrl('/main/quiz/listPage'), formData);
	    			},
	    		});
				
			} else {
				if(noObjectiveItem){
					PNotifyUtil.info({
						text: $.i18n.prop("i.make.objective.item"),
						delay: 1500, 
					});
					console.log("no objective item made");
				}else{
					PNotifyUtil.info({
						text: $.i18n.prop("i.check.essential.item"),
						delay: 1500, 
					});
					console.log("do stuff if form is not valid");
				}
			}
			
		},
	},
};

/***********************************************
 * 로컬 정의함수
 ***********************************************
 */

//퀴즈 리스트
var Quiz = {
	tagId : '#quizContent',
	
	//객관식 UI
	$tempRowObjectiveQuizTag :
		$('<div><div id="quiz-%Q%" class="quizSet"><h2 class="quiz_table_title">'+$.i18n.prop("question")+'.%Q%</h2><div class="float-right control_btn">\
				<button class="quiz_btn_top" type="button" onclick="Quiz.setQuizUp(this);"></button>\
				<button class="quiz_btn_bottom" type="button" onclick="Quiz.setQuizDown(this);"></button>\
				<button class="quiz_btn_del" type="button" onclick="Quiz.delQuiz(this);"></button></div>\
				<table class="table table-bordered">	<colgroup><col width="150px"><col width="*"></colgroup>\
			<tbody>	<tr><th scope="row" class="pt60 pl100"><span class="questionText">'+$.i18n.prop("question")+'</span></th>	\
					<td class="pt40 pl20 form-group"><textarea class="form-control itemSubject" rows="2" name="itemSubject-%Q%"></textarea></td></tr>\
					<tr><th scope="row" class="score">'+$.i18n.prop('q.score')+'</th>\
					<td class="pl20 form-group"><input class="form-control itemPoint" onkeyup="calc()" name="point-%Q%"/><button type="button" class="btn btn-secondary" onclick="Quiz.addSubjectiveItem(this)">'+$.i18n.prop("add.example")+'</button></td></tr>\
				<tr><td colspan="2" class="form-group pl90"><div class="row answers"></div></td></tr>\
				</tbody>\
			</table></div></div>'),
	//객관식 보기 UI		
	$tempRowTagAnswer :
		$('<div><div class="col-12 answer" style="border-top: 1px dotted #ddd; position: relative; padding-top: 10px; padding-left: 20px; padding-bottom: 10px;">\
				<div class="form-group"><input type="checkbox" class="objectiveItemCheck" name="objectiveItemCheck-%Q%"/>\
				<span class="selectText">%A%.'+$.i18n.prop("select")+'</span>\
				<input type="text" class="objectiveItem" name="objectiveItem-%Q%-%A%"/>\
				<button type="button" onclick="Quiz.delAnswer(this);"></button></div>\
			</div></div>'),		
	//주관식 UI		
	$tempRowsubjectiveQuizTag :
		$('<div><div id="quiz-%Q%" class="quizSet"><h2 class="quiz_table_title">'+$.i18n.prop("question")+'.%Q%</h2><div class="float-right control_btn">\
				<button class="quiz_btn_top" type="button" onclick="Quiz.setQuizUp(this);"></button>\
				<button class="quiz_btn_bottom" type="button" onclick="Quiz.setQuizDown(this);"></button>\
				<button class="quiz_btn_del" type="button" onclick="Quiz.delQuiz(this);"></button></div>\
				<table class="table table-bordered answer2">	<colgroup><col width="150px"><col width="*"></colgroup>\
			<tbody>	<tr><th scope="row" class="pt60 pl100"><span class="questionText">'+$.i18n.prop("question")+'</span></th>\
					<td class="pt40 pl20 form-group"><textarea class="form-control itemSubject" rows="2" name="itemSubject-%Q%"></textarea></td></tr>\
					<tr><th scope="row" class="score">'+$.i18n.prop('q.score')+'</th>\
					<td class="pl20 form-group"><input class="form-control itemPoint" onkeyup="calc()" name="point-%Q%"/></td></tr>\
				<tr><td colspan="2" class="pl100"><div class="fc_blue ml10 lh40"><span class="fl pl0">* '+$.i18n.prop("i.input.answer")+'</span></div>\
						<div><div class="answer"><span class="pl0 di">'+$.i18n.prop("correct.answer")+'</span>\
							<input type="text" class="subjectiveItem required answer_txtbox" name="objectiveItemCheck-%Q%-%A%"/></div>\
						</div></td></tr></tbody>\
			</table></div></div>'),				
	//quiz 초기화
	init : function(){
		//처음은 객관식으로 초기화(등록일때만).
		if(Com.isNull(DATA.quizId)){
			this.addObjectiveQuiz();
		}
	},	
	
	//quiz 객관식 추가
	addObjectiveQuiz : function(row){
		var $row = this.$tempRowObjectiveQuizTag.clone();
		var quizLength = $("#quizContent").find('.quizSet').length;
		
		//수정
		if(Com.isNotNull(row)){
			$row = $($row.html().replaceAll("%Q%", row.questionNum));
			
			$row.find(".itemSubject").text(row.subject);
			$row.find(".itemPoint").val(row.point);
			//보기 추가
			for(var i=1; i < (row.itemCnt+1); i++){
				var $itemRow = this.$tempRowTagAnswer.clone();
				$itemRow = $($itemRow.html().replaceAll("%A%", i).replaceAll("%Q%",row.questionNum))
				$itemRow.find("input[class='objectiveItem']").val(row[('item'+i)]);
				
				$.each(row.objectiveAnswer.split("|"), function(index, value){
					if(i == value){
						$itemRow.find("input[class='objectiveItemCheck']").prop("checked", true);
					}
				});
				
				$row.find(".answers").append($itemRow);
			}
			
			$(this.tagId).append($row);
			
		}
		//등록
		else{
			//보기 4개 추가
			var $itemRow = this.$tempRowTagAnswer.clone();
			for(var i=0; i < 4; i++){
				
				var answerLength = $row.find(".answer").length;
				
				$row.find(".answers").append($itemRow.html().replaceAll("%A%", answerLength+1));
			}
			
			$(this.tagId).append($row.html().replaceAll("%Q%", quizLength+1));
			
		}
		
	},
	
	//quiz 주관식 추가
	addSubjectiveQuiz : function(row){
		var $row = this.$tempRowsubjectiveQuizTag.clone();
		var quizLength = $("#quizContent").find('.quizSet').length;
		
		//수정
		if(Com.isNotNull(row)){
			$row = $($row.html().replaceAll("%Q%", row.questionNum).replaceAll("%A%",1));
			
			$row.find(".itemSubject").text(row.subject);
			$row.find(".itemPoint").val(row.point);
			$row.find(".subjectiveItem").val(row.subjectiveAnswer);
			$(this.tagId).append($row);
		}
		//등록
		else{
			$(this.tagId).append($row.html().replaceAll("%Q%", quizLength+1).replaceAll("%A%",1));
		}
		
	},
	//객관식 보기 1개 추가
	addSubjectiveItem : function(obj){
		var $row = this.$tempRowTagAnswer.clone();
		var answerLength = $(obj).closest('div').find(".answer").length;
		if(answerLength < 10){
			$(obj).closest('div').find(".answers").append($row.html().replaceAll("%A%", answerLength+1).replaceAll("%Q%",$(obj).closest('div').attr("id").replace("quiz-","")));
		}else{
			alert($.i18n.prop("i.up.to.10.additional.example.available"));
		}
	
	},
	//객관식 보기 삭제
	delAnswer: function(obj){
		var $obj = $(obj);
		var $objParent = $obj.closest(".quizSet");
		$obj.closest(".answer").remove();
		this.setAnswerNumber($objParent);
	},
	//객관식 보기 번호 재설정
	setAnswerNumber: function(obj){
		var parentCnt = $(obj).attr('id').replace("quiz-","");
		$.each($(obj).find(".answer"), function(idx, row){
			$(row).find(".selectText").text((idx+1) + "." + $.i18n.prop("select"));
			$(row).find('.objectiveItem').attr('name',"objectiveItem-"+parentCnt+"-"+(idx+1));
		});
		
	},
	//문제 삭제
	delQuiz: function(obj){
		$(obj).closest('div').parent().remove()
		this.setQuizNumber(obj);
		calc();
	},
	//문제 번호 재설정(객관식 보기 와 주관식 정답 name 재설정)
	setQuizNumber: function(obj){
		
		$.each($("#quizContent").find('.quizSet'), function(quizSetIdx, quizSetRow){
			$(quizSetRow).find(".quiz_table_title").text($.i18n.prop("question") + "."+(quizSetIdx+1));
			$(quizSetRow).attr('id', 'quiz-'+(quizSetIdx+1));
			
			
			//문제 질문 NAME 변경
			$(quizSetRow).find('.itemSubject').attr('name',"itemSubject-"+(quizSetIdx+1));
			
			//배점 NAME 변경
			$(quizSetRow).find('.itemPoint').attr('name',"point-"+(quizSetIdx+1));
			
			//객관식 보기 NAME 변경
			$.each($(quizSetRow).find(".answer"), function(answeridx, answerRow){
				$(answerRow).find('.objectiveItem').attr('name',"objectiveItem-"+(quizSetIdx+1)+"-"+(answeridx+1));
				$(answerRow).find('.objectiveItemCheck').attr('name',"objectiveItemCheck-"+(quizSetIdx+1));
			});
			//주관식 정답 NAME 변경
			$.each($(quizSetRow).find(".subjectiveItem"), function(answeridx, answerRow){
				$(answerRow).attr('name',"objectiveItemCheck-"+(quizSetIdx+1)+"-1");
			});
		});
	},
	//문제 업
	setQuizUp: function(obj){
		var $obj = $(obj).closest(".quizSet"); // 클릭한 버튼이 속한 div 요소
		$obj.prev().before($obj); 
		this.setQuizNumber(obj);
	},
	//문제 다운
	setQuizDown: function(obj){
		var $obj = $(obj).closest(".quizSet"); // 클릭한 버튼이 속한 div 요소
		$obj.next().after($obj); 
		this.setQuizNumber(obj);
	},
	
	// 수정 row list 추가
	viewDataList : function(list){
		$.each(list, function(idx, row){
			//객관식
			if(row.subjectiveYn == 'N'){
				Quiz.addObjectiveQuiz(row);
			}
			//주관식
			else{
				Quiz.addSubjectiveQuiz(row);
			}
		});
	},
	
}

// 총점 계산 함수
function calc(){
	var list=$("#quizContent").find(".itemPoint");
	var total=0;
	for(var i=0;i<list.length;i++){
		if(list[i].value!=null && list[i].value != ""){
			var score = parseInt(list[i].value);
			total +=score;
		}
	}
	
	document.getElementById("total").value = total;
}
