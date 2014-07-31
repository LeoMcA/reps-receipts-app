// var bugzilla = 'https://bugzilla.mozilla.org/';
var bugzilla = 'https://landfill.bugzilla.org/bugzilla-tip/';

var apiEndpoint = bugzilla+'rest/';

function get(url){
  return new Promise(function(resolve, reject){
    var req = new XMLHttpRequest({ mozSystem: true });
    req.open('GET', url);

    req.setRequestHeader('Content-Type', 'application/json');
    req.setRequestHeader('Accept', 'application/json');

    req.onload = function(){
      if(req.status == 200) resolve(JSON.parse(req.response));
      else reject(Error(req.statusText));
    };

    req.onerror = function(){
      reject(Error("Network Error"));
    };

    req.send();
  });
}

function post(url, data){
  return new Promise(function(resolve, reject){
    var req = new XMLHttpRequest({ mozSystem: true });
    req.open('POST', url);

    req.setRequestHeader('Content-Type', 'application/json');
    req.setRequestHeader('Accept', 'application/json');

    req.onload = function(){
      if(req.status == 200 || req.status == 201) resolve(JSON.parse(req.response));
      else reject(Error(req.statusText));
    };

    req.onerror = function(){
      reject(Error("Network Error"));
    };

    req.send(JSON.stringify(data));
  });
}

function login(email, password){
  return new Promise(function(resolve, reject){
    get(apiEndpoint+'login?login='+encodeURIComponent(email)+'&password='+encodeURIComponent(password)).then(function(res){
      if(res.error) reject(Error(res.message));
      else resolve(res.token);
    }, function(error){
      reject(error);
    });
  });
}

window.addEventListener('DOMContentLoaded', function(){

  function showAttachForm(id){
    document.querySelector('#attach').style.display = 'block';
    document.querySelector('#attach').dataset.id = id;
  }

  function getBugs(){
    // get(apiEndpoint+'bug?token='+encodeURIComponent(token)+'&include_fields=id,summary&product=Mozilla Reps&component=Budget Requests&creator='+encodeURIComponent(email)).then(function(res){
    get(apiEndpoint+'bug?token='+encodeURIComponent(token)+'&include_fields=id,summary&creator='+encodeURIComponent(email)).then(function(res){
      if(res.error) console.log(Error(res.message));
      else {
        var ul = document.querySelector('#bugs');
        res.bugs.forEach(function(val){
          var li = document.createElement('li');

          li.appendChild(document.createTextNode(val.summary+' '));

          var bugLink = document.createElement('a');
          bugLink.href = bugzilla+'show_bug.cgi?id='+val.id;
          bugLink.appendChild(document.createTextNode('[#'+val.id+']'));
          li.appendChild(bugLink);

          li.appendChild(document.createTextNode(' '));

          var photoLink = document.createElement('a');
          photoLink.href = '#';
          photoLink.appendChild(document.createTextNode('[Add Receipt]'));
          photoLink.addEventListener('click', function(){ showAttachForm(val.id) });
          li.appendChild(photoLink);

          ul.appendChild(li);
        });
      }
    }, function(error){
      console.log(error);
    });
  }

  var loginForm = document.querySelector('#login');
  var emailInput = document.querySelector('#email');
  var passwordInput = document.querySelector('#password');

  var attachForm = document.querySelector('#attach');
  var fileInput = document.querySelector('#file');
  var summaryInput = document.querySelector('#summary');

  var email = false;
  var password = false;
  var token = false;

  loginForm.addEventListener('submit', function(e){
    e.preventDefault();

    var emailVal = emailInput.value;
    var passwordVal = passwordInput.value;

    login(emailVal, passwordVal).then(function(resToken){
      email = emailVal;
      password = passwordVal;
      token = resToken;
      loginForm.style.display = 'none';
      getBugs();
    }, function(error){
      console.log(error);
    });
  });

  attachForm.addEventListener('submit', function(e){
    e.preventDefault();

    var file = fileInput.files[0];
    var reader = new FileReader();
    var summaryVal = summaryInput.value;
    var preview = document.querySelector('img');

    reader.onloadend = function(){
      preview.src = reader.result;

      post(apiEndpoint+'bug/'+e.target.dataset.id+'/attachment', {
        token: token,
        data: reader.result.split(';base64,')[1],
        file_name: file.name,
        summary: summaryVal,
        content_type: file.type
      }).then(function(res){
        console.log(res);
      }, function(error){
        console.log(error);
      });
    }

    reader.readAsDataURL(file);
  });
});
