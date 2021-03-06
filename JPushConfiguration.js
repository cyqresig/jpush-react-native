//   这个地方是更新配置文件 的脚本
var fs = require('fs');
var spath = require('path');
var os = require('os');

// add other link flag
var appKey = process.argv.splice(2)[0];
if (appKey == undefined || appKey == null) {
	console.log("error 没有输入 appKey 参数");
	return;
}

var moduleName = process.argv.splice(2)[1];
if (moduleName == undefined || moduleName == null) {
	console.log("没有输入 moduleName, 将使用默认模块名： app");
	moduleName = "app";
};

function projectConfiguration(path){
	
	if (isFile(path) == false) {
		console.log("configuration JPush error!!");
		return;
	}

	var rf = fs.readFileSync(path,"utf-8");
	rf = rf.replace(/				OTHER_LDFLAGS = \(/g, "				OTHER_LDFLAGS = \(\n\
						\"-framework\",\n\
						Adsupport,\n\
						\"-framework\",\n\
						Security,\n\
						\"-framework\",\n\
						UIKit,\n\
						\"-framework\",\n\
						Foundation,\n\
						\"-framework\",\n\
						CoreGraphics,\n\
						\"-framework\",\n\
						SystemConfiguration,\n\
						\"-framework\",\n\
						CoreTelephony,\n\
						\"-framework\",\n\
						CoreFoundation,\n\
						\"-framework\",\n\
						CFNetwork,\n\
                        \"-lresolv\",\n\
						\"-lz\",");
	fs.writeFileSync(path, rf, "utf-8");	
}


function insertJpushCode(path){
	// 	 这个是插入代码的脚本 install


	if (isFile(path) == false) {
		console.log("configuration JPush error!!");
		return;
	}

	var rf = fs.readFileSync(path,"utf-8");
	// 删除所有的 JPush 相关代码  注册推送的没有删除，
	rf = rf.replace(/\n\#import \<RCTJPushModule.h\>/,"");
    rf = rf.replace(/\n\#ifdef NSFoundationVersionNumber_iOS_9_x_Max/,"");
    rf = rf.replace(/\n\#import \<UserNotifications\/UserNotifications\.h\>/,"");
    rf = rf.replace(/\n\#import \<UserNotifications\/UserNotifications\.h\>/,"");
    rf = rf.replace(/\n\#endif/,"");
	rf = rf.replace(/\[JPUSHService registerDeviceToken:deviceToken\]\;\n/,"");

	// 插入 头文件
	rf = rf.replace(/#import "AppDelegate.h"/,"\#import \"AppDelegate.h\"\n\#import \<RCTJPushModule.h\>\n\#ifdef NSFoundationVersionNumber_iOS_9_x_Max\n\#import \<UserNotifications\/UserNotifications\.h\>\n\#endif");
	fs.writeFileSync(path, rf, "utf-8");


	 // 这个是删除代码的脚本 uninstall
	// var rf = fs.readFileSync(path,"utf-8");
	// rf = rf.replace(/#import "AppDelegate.h"[*\n]#import <RCTJPushModule.h>/,"\#import \"AppDelegate.h\"");
	// fs.writeFileSync(path, rf, "utf-8");

	// 插入 注册推送 和启动jpush sdk
// - (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
// {
	var rf = fs.readFileSync(path,"utf-8");
	var searchDidlaunch = rf.match(/\n.*didFinishLaunchingWithOptions.*\n?\{/);
	if (searchDidlaunch == null) {
		console.log("没有匹配到 didFinishLaunchingWithOptions");
		console.log(rf);
	} else {
		// console.log(searchDidlaunch[0]);
        var oldValue = rf.match(/\[JPUSHService registerForRemoteNotificationTypes/)
        if(oldValue == null) {
                    rf = rf.replace(searchDidlaunch[0],searchDidlaunch[0] + "\n    if \(\[\[UIDevice currentDevice\]\.systemVersion floatValue\] >= 10.0\) \{\n \#ifdef NSFoundationVersionNumber_iOS_9_x_Max\n    JPUSHRegisterEntity \* entity \= \[\[JPUSHRegisterEntity alloc\] init\]\;\n     entity\.types \= UNAuthorizationOptionAlert\|UNAuthorizationOptionBadge\|UNAuthorizationOptionSound\;\n     \[JPUSHService registerForRemoteNotificationConfig\:entity delegate\:self\]\;\n \n\#endif\n\} else if \(\[\[UIDevice currentDevice\]\.systemVersion floatValue\] \>\= 8\.0\) \{\n\
    \[JPUSHService registerForRemoteNotificationTypes\:\(UIUserNotificationTypeBadge \|\n\
                                                      UIUserNotificationTypeSound \|\n\
                                                      UIUserNotificationTypeAlert\)\n\
                                          categories\:nil\]\;\n\
  \} else \{\n\
    \[JPUSHService registerForRemoteNotificationTypes\:\(UIRemoteNotificationTypeBadge \|\n\
                                                      UIRemoteNotificationTypeSound \|\n\
                                                      UIRemoteNotificationTypeAlert)\n\
                                          categories\:nil\]\;\n\
  }\n\
  \n\
  \[JPUSHService setupWithOption\:launchOptions appKey\:\@\"" + appKey + "\"\n\
                        channel\:nil apsForProduction\:nil\]\;");
                    fs.writeFileSync(path, rf, "utf-8");
        }

	}
	
	
	//  这个插入代码 didRegisterForRemoteNotificationsWithDeviceToken
	var rf = fs.readFileSync(path,"utf-8");
	var search = rf.match(/\n.*didRegisterForRemoteNotificationsWithDeviceToken\:\(NSData \*\)deviceToken[ ]*\{/);

	if (search == null) {
		console.log("没有匹配到 函数 didRegisterForRemoteNotificationsWithDeviceToken");
		rf = rf.replace(/\@end/,"\- \(void\)application\:\(UIApplication \*\)application\ndidRegisterForRemoteNotificationsWithDeviceToken\:\(NSData \*\)deviceToken \{\n\[JPUSHService registerDeviceToken:deviceToken\]\;\n\}\n\@end");
		// console.log(rf);
		fs.writeFileSync(path, rf, "utf-8");
	} else {
		console.log(search[0]);
        var oldValue = rf.match(/\[JPUSHService registerDeviceToken/)
        if(oldValue == null) {
            rf = rf.replace(search[0],search[0]+"\n\[JPUSHService registerDeviceToken:deviceToken\]\;");
            fs.writeFileSync(path, rf, "utf-8");            
        } else{
            console.log("registerDeviceToken存在，不在插入");
        }

	}
}


// 判断文件
function exists(path){  
     return fs.existsSync(path) || path.existsSync(path);  
} 

function isFile(path){  
    return exists(path) && fs.statSync(path).isFile();  
} 

function isDir(path){  
    return exists(path) && fs.statSync(path).isDirectory();  
} 


//  深度遍历所有文件，  
getAllfiles("./ios",function (f, s) {
  var isAppdelegate = f.match(/AppDelegate\.m/);
  // 找到Appdelegate.m 文件 插入代码
  if (isAppdelegate != null) {  
  	console.log("the file is appdelegate:"+f);
	insertJpushCode(f);
  }

  // 找到 iOS 工程文件，插入需要链接的库文件
  var isiOSProjectPbxprojFile = f.match(/[.]*\.pbxproj/);
  if (isiOSProjectPbxprojFile != null) {
  	console.log("the file is iOS project file:"+f);
  	projectConfiguration(f);
  }
});

getAndroidManifest("./android/" + moduleName, function(f, s) {
	var isAndroidManifest = f.match(/AndroidManifest\.xml/);
	if (isAndroidManifest != null) {
		console.log("find AndroidManifest in " + moduleName);
		configureAndroidManifest(f);
	};
});

getConfigureFiles("./android", function (f, s) {
	//找到settings.gradle
	var isSettingGradle = f.match(/settings\.gradle/);
	if (isSettingGradle != null) {
		console.log("find settings.gradle in android project " + f);
		configureSetting(f);
	}

	//找到project下的build.gradle
	var isProjectGradle = f.match(/.*\/build\.gradle/);
	if (isProjectGradle != null) {
		console.log("find build.gradle in android project " + f);
		configureGradle(f);
		// configureAppkey(f);
	}
});
// getAllfiles("./",function(f,s){
//   console.log(f);
//   var isAppdelegate = f.match(/AppDelegate\.m/);
//   var isiOSProjectPbxprojFile = f.match(/[.]*\.pbxproj/);
// });
// function to get all file 
function getAllfiles(dir, findOne) {
  // if (arguments.length < 2) throw new TypeError('Bad arguments number');

  if (typeof findOne !== 'function') {
    throw new TypeError('The argument "findOne" must be a function');
  }

  eachFileSync(spath.resolve(dir), findOne);
}

function eachFileSync (dir, findOne) {
  var stats = fs.statSync(dir);
  findOne(dir, stats);

  // 遍历子目录
  if (stats.isDirectory()) {
    var files = fullPath(dir, fs.readdirSync(dir));
    // console.log(dir);
    files.forEach(function (f) {
      eachFileSync(f, findOne);
    });
  }
}

function fullPath (dir, files) {
  return files.map(function (f) {
    return spath.join(dir, f);
  });
}



// android
function getGradleFile(dir, findOne) {
	if (typeof findOne !== 'function') {
		throw new TypeError('The argument "findOne" must be a function');
	}

	eachFileSync(spath.resolve(dir), findOne);

}

function getAndroidManifest(dir, findOne) {
	if (typeof findOne !== 'function') {
		throw new TypeError('The argument "findOne" must be a function');
	}

	eachFileSync(spath.resolve(dir), findOne);
}

function getConfigureFiles(dir, findOne) {
	if (typeof findOne !== 'function') {
		throw new TypeError('The argument "findOne" must be a function');
	}

	eachFileSync(spath.resolve(dir), findOne);
}

function configureAndroidManifest(path) {
	if (isFile(path) == false) {
		console.log("configuration JPush error!!");
		return;
	}

	var rf = fs.readFileSync(path, "utf-8");
	var isAlreadyWrite = rf.match(/.*android\:value=\"\$\{JPUSH_APPKEY\}\"/);
	if (isAlreadyWrite == null) {
		var searchKey = rf.match(/\n.*\<\/activity\>/);
		if (searchKey != null) {
			rf = rf.replace(searchKey[0], searchKey[0] + "\n\n\<meta-data android\:name=\"JPUSH_CHANNEL\" android\:value=\"\$\{APP_CHANNEL\}\"\/\>\n\<meta-data android\:name=\"JPUSH_APPKEY\" android\:value=\"\$\{JPUSH_APPKEY\}\"\/\>\n");
			fs.writeFileSync(path, rf, "utf-8");
		}
	};
}

// function configureAppkey(path) {
// 	if (isFile(path) == false) {
// 		console.log("configuration JPush error!!");
// 		return;
// 	}

// 	var rf = fs.readFileSync(path, "utf-8");
// 	var searchAppkey = rf.match(/\n.*JPUSH_APPKEY\:/);
// 	if (searchAppkey == null) {
// 		var insertKey = rf.match()
// 		rf = rf.replace(/yourAppKey/, appKey);
// 		fs.writeFileSync(path, rf, "utf-8");
// 	}
// }

function configureSetting(path) {
	if (isFile(path) == false) {
		console.log("configuration JPush error!!");
		return;
	}

	var rf = fs.readFileSync(path, "utf-8");
	var isAlreadyWrite = rf.match(/.*jpush-react-native.*/);
	if (isAlreadyWrite == null) {
		var searchKey = rf.match(/\n.*include.*/);
		if (searchKey != null) {
			rf = rf.replace(searchKey[0], searchKey[0] + "\, \'\:jpush-react-native\'\nproject\(\'\:jpush-react-native\'\)\.projectDir = new File\(rootProject\.projectDir\, \'\.\.\/node_modules\/jpush-react-native\/android\'\)\n" );
			fs.writeFileSync(path, rf, "utf-8");
		} else {
			console.log("Did not find include in settings.gradle: " + path);
		}
	}
	
}

function configureGradle(path) {
	if (isFile(path) == false) {
		console.log("configuration JPush error!!");
		return;
	}

	var rf = fs.readFileSync(path, "utf-8");
	var isAlreadyWrite = rf.match(/.*jpush-react-native.*/);
	if (isAlreadyWrite == null) {
		var searchKey = rf.match(/\n.*compile fileTree.*\n/);
		if (searchKey != null) {
			rf = rf.replace(searchKey[0], searchKey[0] + "    compile project\(\'\:jpush-react-native\'\)\n");
			fs.writeFileSync(path, rf, "utf-8");
		} else {
			console.log("Did not find \"compile\" in path: " + path);
		}
	}
}
