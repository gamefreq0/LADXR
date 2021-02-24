"use strict";

var spoilerContent;

function ID(id) { return document.getElementById(id); }


function updateForm()
{
    var rom = ID("rom");

    if (rom.files.length < 1)
        setValidRom(false);
    else if (rom.files[0].size != 1024 * 1024)
        setValidRom(false);
    else
    {
        rom.files[0].arrayBuffer().then(function(buffer) {
            var a = new Int8Array(buffer);
            if (a[0x14D] != 60) // check the header checksum, simplest check for 1.0 version
                setValidRom(false);
            else
                setValidRom(true);
        });
    }
}

function setValidRom(valid)
{
    ID("submitbutton").disabled = !valid;
    if (valid)
        ID("romlabel").classList.remove("selectromwarning");
    else
        ID("romlabel").classList.add("selectromwarning");
}

function b64toBlob(b64Data, contentType='', sliceSize=512)
{
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, {type: contentType});
    return blob;
}

function downloadRom(filename, blob)
{
    var element = document.createElement('a');
    element.href = window.URL.createObjectURL(blob);
    element.download = filename;
    element.click();
}

function downloadSpoilers()
{
    var seed = $("#seedSpan").html();
    var fileExtension = $("#spoilerformat").val() === "text" ? ".txt" : ".json";

    var element = document.createElement('a');
    element.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(spoilerContent);
    element.download = "LADXR_" + seed + fileExtension;
    element.click();
}

function startSeedGeneration()
{
    ID("generatingdialog").checked = true;
    randomGenerationString();
}
function randomGenerationString()
{
    if (Math.random() < 0.8)
    {
        var items = ["Power bracelet", "Shield", "Bow", "Hookshot", "Magic Rod", "Pegasus Boots", "Ocarina", "Feather", "Shovel", "Magic Powder", "Bomb", "Sword", "Flippers", "Medicine", "Tail Key", "Angler Key", "Face Key", "Bird Key", "Slime Key", "Gold Leaf", "Rupees", "Seashell", "Message", "Gel", "Boomerang", "Heart Piece", "Bowwow", "Arrows", "Single Arrow", "Max Powder Upgrade", "Max Bombs Upgrade", "Max Arrows Upgrade", "Red Tunic", "Blue Tunic", "Heart Container", "Toadstool", "Small Key", "Nightmare Key", "Map", "Compass", "Stone Beak", "Instrument"];
        var item = items[Math.floor(Math.random() * items.length)];
        ID("generatingtext").innerText = "Placing " + item;
    } else {
        ID("generatingtext").innerText = "Shuffling D" + Math.floor(Math.random() * 8);
    }
    if (ID("generatingdialog").checked)
        setTimeout(randomGenerationString, 1000);
}

function seedComplete(data)
{
    ID("generatingdialog").checked = false;

    if (data.success)
    {
        ID("seeddonedialog").checked = true;

        blob = b64toBlob(data.rom, "application/octet-stream");
        downloadRom(data.romFilename, blob);

        ID("seedSpan").innerText = data.seed;

        spoilerContent = data.spoiler

        if (ID("spoilerformat").value !== "none")
            ID("spoilerButton").style.display = '';
        else
            ID("spoilerButton").style.display = 'none';
    }
    else
    {
        ID("errordialog").checked = true;
        if (data.message)
            ID("failureMessage").innerText = data.message;
        else
            ID("failureMessage").innerText = JSON.stringify(data);
    }
}

document.addEventListener('DOMContentLoaded', (event) => {
    ID("rom").onchange = function(event) {
        updateForm();
    }
    ID("form").oninput = function() {
        var data = "";
        for(var e of ID("form").elements)
           if (e.name != "" && e.name != "rom")
                data += "&" + encodeURIComponent(e.name) + "=" + encodeURIComponent(e.value);
        document.location.hash = data;
    }
    updateForm();
    for(var kv of document.location.hash.split("&"))
    {
        var kv = kv.split("=");
        if (kv.length > 1)
            ID(kv[0]).value = kv[1];
    }

    var gfxinfo = document.createElement("span");
    var gfximg = document.createElement("img");
    ID("gfxmod").parentElement.appendChild(gfximg);
    ID("gfxmod").parentElement.appendChild(gfxinfo);
    ID("gfxmod").oninput = function()
    {
        if (ID("gfxmod").value != "")
            gfximg.src = "LADXR/gfx/" + ID("gfxmod").value + ".png";
        else
            gfximg.src = "";
        gfxinfo.innerHTML = gfxInfoMap[ID("gfxmod").value];
    }
    var gfxInfoMap = {};
    //TODO
    //<?php foreach($gfx_info as $k => $v) { ?>
    //    gfxInfoMap["<?=$k?>"] = "<?=$v?>";
    //<?php } ?>

    $("#form").submit(function(e) {
        e.preventDefault();
        var form = e.target;
        var url = form.action;
        var formData = new FormData(form);

        startSeedGeneration();

        var req = new XMLHttpRequest();
        req.open("POST", url);
        req.addEventListener("load", function()
        {
            var response = req.response;
            try { response = JSON.parse(response); } catch {}
            seedComplete(response);
        });
        req.send(formData);
    });
});