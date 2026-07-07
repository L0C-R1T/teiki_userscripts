// ==UserScript==
// @name        L0C__Stb_FavParty
// @version     2026-07-07
// @description ヒサギゲーで連れ出しのお気に入りとかできたらいいな～なやつ
// @author      L0C_R1T
// @match       https://soraniwa.428.st/stb/*
// @icon        https://www.google.com/s2/favicons?sz=64&domain=https://soraniwa.428.st/stb/
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// ==/UserScript==
/* global jQuery:false */

(($) => {
  let partyJsonRaw = GM_getValue("partyData",null);
  let partyJson = (partyJsonRaw!==null)?JSON.parse(partyJsonRaw).flat(Infinity):null;
  let parties = (partyJson!==null)?Array.from(new Map(partyJson.map((party)=>[party.members, party])).values()):null;

  $(window).load(function(){
    let params = new URL(document.location).searchParams;
    let pgMode = params.get("mode");
    if (pgMode === "action") {
      console.log("[StbFavParty] : 有効");
      l0cActionPage();
    } else {
      console.log("[StbFavParty] : 無効");
    }
  });

  function l0cActionPage() {
    $('div.framearea > form[method="post"]:first > p:first > input#memberreset').before('<input type="button" id="l0c_ptrg" class="l0c_btn" value="編成を登録">　');
    $('div.framearea > form[method="post"]:first').prepend('<div id="l0c_fp"><select id="l0c_ptli" name="l0c_ptli"><option value="-1"> - - - 登録パーティから選択 - - - </option></select> <input type="button" id="l0c_ptset" value="セット">　<input type="button" id="l0c_ptdel" value="削除"></div><br><br>パーティ情報を <input type="button" id="l0c_ptin" class="l0c_btn" value="ファイルから読込"><input type="file" style="display:none;" id="l0c_ptfile"> <input type="button" id="l0c_ptex" class="l0c_btn" value="ファイルに保存"><br><br><br>');
    $('#l0c_ptset, #l0c_ptrg, #l0c_ptdel').css({
      padding: "5px",
      paddingLeft: "16px",
      paddingRight: "16px",
      border: "1px #ccddff99 solid",
      borderRadius: "2px",
      backgroundColor: "#5577cc",
      boxShadow: "0px 2px 2px #22110099",
      color: "#ffffff",
      fontWeight: "bold",
      cursor: "pointer",
    });
    $('#l0c_ptdel').css({backgroundColor:"#cc5577"});
    $("#l0c_ptset").on("click", setParty);

    if (parties) {
      listPartyData();
    }
    $('#l0c_ptrg').on("click", savePartyData);

    $('#l0c_ptset, #l0c_ptrg').hover(function(){
      $(this).css({backgroundColor: "#224499"});
    },function(){
      $(this).css({backgroundColor: "#5577cc"});
    });
    $('#l0c_ptdel').on("click",deletePartyData);

    $('#l0c_ptin').on("click",()=>{
      $('#l0c_ptfile').click();
    });
    $('#l0c_ptfile').on("change",onChange);

    if(parties){
      $('#l0c_ptex').on("click",()=>{
        let partyExData = JSON.stringify(parties);
        const link = document.createElement('a');
        link.download = 'StbPartyData.json'; // ダウンロードファイル名称
        link.href = URL.createObjectURL(new Blob([partyExData],{type:"application/json"})); // オブジェクト URL を生成
        link.click(); // クリックイベントを発生させる
        URL.revokeObjectURL(link.href); // オブジェクト URL を解放」
      });
    }
  }

  function onChange(event){
    var reader=new FileReader();
    reader.onload = onReaderLoad;
    reader.readAsText(event.target.files[0]);
  }

  function onReaderLoad(event){
    console.log(event.target.result);
    var obj = JSON.parse(event.target.result);
    parties = obj;
    listPartyData();
    alert("編成リストを読み込みました。");
  }

  function listPartyData() {
    const Sel = $('#l0c_ptli');
    if($('#l0c_ptli > option').length>1){
      $('#l0c_ptli > option').not('[value="-1"]').remove();
    }
    for (let i = 0; i < parties.length; i++){
      Sel.append(`<option value="${i}">${parties[i].ptnm}</option>`);
    }
  }

  function savePartyData() {
    var partyMember = [];
    if ($('#d1').val() != "") partyMember.push($("#d1").val());
    if ($("#d2").val() != "") partyMember.push($("#d2").val());
    if ($("#d3").val() != "") partyMember.push($("#d3").val());
    if ($("#d4").val() != "") partyMember.push($("#d4").val());

    let partyName = "";
    const PartyNum = partyMember.length+1;

    if (PartyNum === 1) {
      partyName = "ソロ";
    } else if (PartyNum === 2) {
      partyName = window.prompt("ペア名を入力してください(空欄可)", "");
      if (partyName == "") partyName = `ペア (${partyMember[0]})`;
      else partyName += ` (ペア / ${partyMember[0]})`;
    }
    else {
      partyName = window.prompt("編成名を入力してください(空欄可)", "");
      if (partyName == "") partyName = `${PartyNum}人 (`;
      else partyName += ` (${PartyNum}人 / `;

      for (let i = 0; i < PartyNum-1; i++){
        partyName += `${partyMember[i]}`;
        if(i<partyMember.length-1) partyName += "・";
      }
      partyName += ")";
    }
    if (window.confirm(`編成「${partyName}」を登録します。\nよろしいですか?`)) {
      const Party = {
        ptnm: partyName,
        members: partyMember,
        member_n: PartyNum,
      };
      if(parties===null) parties = [];
      parties.push(Party);
      GM_deleteValue("partyData");
      let uniqueParties = parties.flat(Infinity);
      GM_setValue("partyData", JSON.stringify(uniqueParties));
      if (localStorage.hasOwnProperty("partyData")) {
        localStorage.removeItem("partyData");
        localStorage.setItem("partyData",JSON.stringify(uniqueParties));
      }
      parties = uniqueParties;
      listPartyData();
    } else {
      alert("登録がキャンセルされました。");
      return false;
    }
  }

  function setParty() {
    let id = parseInt($("#l0c_ptli").val());
    console.log(id)
    if(id===-1) return false;
    const FullMem = $('#fullmember');
    if(parties){
      const PtInfo = parties[id];
      if (PtInfo.member_n === 1 && FullMem.prop("checked")) FullMem.removeAttr("checked").prop("checked", false);
      else {
        for (let i = 0; i < PtInfo.member_n - 1; i++) $(`#d${i + 1}`).val(PtInfo.members[i]);
        if (PtInfo.member_n !== 5 && FullMem.prop("checked")) FullMem.removeAttr("checked").prop("checked", false);
      }
    }
  }

  function deletePartyData() {
    const id = parseInt($('#l0c_ptli').val());
    if(window.confirm(`編成「${$('#l0c_ptli > option:selected').text()}」を削除してもよろしいですか?`)){
      parties.splice(id,1);
      $(`#l0c_ptli > option[value="${id}"]`).remove();
    }else{
      alert("削除が取り消されました。");
      return false;
    }
  }
})(jQuery);
