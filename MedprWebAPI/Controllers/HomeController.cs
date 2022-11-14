﻿using MedprMVC.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using System.Diagnostics;
using System.Text.Encodings.Web;
using System.Text;
using MedprCore.Abstractions;
using AutoMapper;
using MedprCore.DTO;
using MedprCore;
using Microsoft.Extensions.Logging;
using MedprDB.Entities;
using Serilog;
using MedprModels.Responses;
using MedprModels.Requests;
using AspNetSample.WebAPI.Utils;

namespace MedprMVC.Controllers;

/// <summary>
/// Controller for users and errors
/// </summary>
[Route("app")]
[ApiController]
public class AppController : ControllerBase
{
    private readonly ILogger<HomeController> _logger;
    private readonly UserManager<IdentityUser<Guid>> _userManager;
    private readonly RoleManager<IdentityRole<Guid>> _roleManager;
    private readonly SignInManager<IdentityUser<Guid>> _signInManager;
    private readonly IJwtUtil _jwtUtil;
    private readonly IUserService _userService;
    private readonly IMapper _mapper;

    public AppController(ILogger<HomeController> logger,
        UserManager<IdentityUser<Guid>> userManager,
        RoleManager<IdentityRole<Guid>> roleManager,
        SignInManager<IdentityUser<Guid>> signInManager,
        IJwtUtil jwtUtil,
        IMapper mapper,
        IUserService userService)
    {
        _logger = logger;
        _userManager = userManager;
        _roleManager = roleManager;
        _signInManager = signInManager;
        _jwtUtil = jwtUtil;
        _mapper = mapper;
        _userService = userService;
    }

    /// <summary>
    /// Error handler
    /// </summary>
    /// <param name="errorModel">Model for message and status code</param>
    /// <returns></returns>
    [ApiExplorerSettings(IgnoreApi = true)]
    public IActionResult Error(ErrorModel errorModel)
    {
        return Problem(detail: errorModel.Message, statusCode: errorModel.StatusCode);
    }

    /// <summary>
    /// Register user in the app
    /// </summary>
    /// <param name="model">User credentials</param>
    /// <returns></returns>
    [AllowAnonymous]
    [HttpPost]
    [ProducesResponseType(typeof(TokenResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(Nullable), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> SignUp([FromForm]UserModelRequest model)
    {
        try
        {
            if (ModelState.IsValid)
            {
                var identityUser = new IdentityUser<Guid>(model.Login);
                var result = await _userManager.CreateAsync(identityUser, model.Password);

                if (result.Succeeded)
                {
                    if (await EnsureRoleCreatedAsync("Default"))
                    {
                        var role = await _roleManager.FindByNameAsync("Default");
                        var roleResult = await _userManager.AddToRoleAsync(identityUser, role.Name);

                        if (roleResult.Succeeded)
                        {
                            var dto = _mapper.Map<UserDTO>(model);
                            dto.Id = Guid.Parse(await _userManager.GetUserIdAsync(identityUser));
                            await _userService.CreateUserAsync(dto);
                        }
                    }
                    await CreateAdmin();
                    await _signInManager.SignInAsync(identityUser, isPersistent: false);

                    var userModel = await _userService.GetUserByIdAsync(identityUser.Id);
                    var userResponse = _mapper.Map<UserModelResponse>(userModel);

                    var userRole = await _userManager.GetRolesAsync(identityUser);
                    userResponse.Role = userRole[0];

                    var response = _jwtUtil.GenerateToken(userResponse);
                    return CreatedAtAction(nameof(SignUp), new { id = identityUser.Id }, response);
                }
            }
            return Ok();
        }
        catch (Exception ex)
        {
            Log.Error($"{ex.Message}. {Environment.NewLine} {ex.StackTrace}");
            ErrorModel errorModel = new()
            {
                Message = "Could not register new user",
                StatusCode = StatusCodes.Status500InternalServerError,
            };
            return RedirectToAction("Error", "Home", errorModel);
        }
    }

    //[AllowAnonymous]
    //[HttpPost]
    //public async Task<IActionResult> Login(UserModel model)
    //{
    //    try
    //    {
    //        if (model.Login.Any() && model.Password.Any())
    //        {
    //            var result = await _signInManager
    //                .PasswordSignInAsync(model.Login, model.Password, isPersistent: false, lockoutOnFailure: false);

    //            if (result.Succeeded)
    //            {
    //                return RedirectToAction("Index", "Home");
    //            }
    //            ModelState.AddModelError(string.Empty, "Invalid login attempt.");
    //            return View(model);
    //        }
    //        return View(model);
    //    }
    //    catch (Exception ex)
    //    {
    //        Log.Error($"{ex.Message}. {Environment.NewLine} {ex.StackTrace}");
    //        return RedirectToAction("Error", "Home");
    //    }
    //}

    //public async Task<IActionResult> Logout()
    //{
    //    try
    //    {
    //        await _signInManager.SignOutAsync();
    //        return RedirectToAction("Login", "Home");
    //    }
    //    catch (Exception ex)
    //    {
    //        Log.Error($"{ex.Message}. {Environment.NewLine} {ex.StackTrace}");
    //        return RedirectToAction("Error", "Home");
    //    }
    //}

    //[HttpGet]
    //public IActionResult Denied()
    //{
    //    return View();
    //}

    //private async Task<bool> EnsureRoleCreatedAsync(string roleName)
    //{
    //    var role = await _roleManager.FindByNameAsync(roleName);
    //    bool check =
    //        role != null && await _roleManager.RoleExistsAsync(role.Name);

    //    if (!check)
    //    {
    //        var newRole = new IdentityRole<Guid>(roleName);
    //        await _roleManager.CreateAsync(newRole);
    //    }
    //    return true;
    //}

    private async Task<bool> EnsureRoleCreatedAsync(string roleName)
    {
        var role = await _roleManager.FindByNameAsync(roleName);
        bool check =
            role != null && await _roleManager.RoleExistsAsync(role.Name);

        if (!check)
        {
            var newRole = new IdentityRole<Guid>(roleName);
            await _roleManager.CreateAsync(newRole);
        }
        return true;
    }

    private async Task CreateAdmin()
    {
        if (await _userManager.FindByEmailAsync("admin@admin.com") == null
            && await EnsureRoleCreatedAsync("Admin"))
        {
            var admin = new IdentityUser<Guid>("admin@admin.com");
            var result = await _userManager.CreateAsync(admin, "Admin_1_Admin");
            if (result.Succeeded)
            {
                var role = await _roleManager.FindByNameAsync("Admin");
                var roleResult = await _userManager.AddToRoleAsync(admin, role.Name);

                if (roleResult.Succeeded)
                {
                    _logger.LogTrace("Admin seeded");
                }
            }
        }
        else
        {
            _logger.LogTrace("Admin is not seeded");
        }
    }
}